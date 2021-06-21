<template>
  <div class="about">
    <h1>查询数据集</h1>
    <el-row>
      <el-select v-model="selected_value" @change="selectChange">
        <el-option
          v-for="item in select_options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        >
        </el-option>
      </el-select>
      <el-autocomplete
        id="search-input"
        v-model="auto_complete_state"
        :fetch-suggestions="querySearchAsync"
        placeholder="请输入企业或个人名称"
        @select="handleSelect"
      ></el-autocomplete>
      <el-button
        type="primary"
        :loading="loading"
        id="search-button"
        @click="queryByButton"
        :disabled="disable_search"
        >搜索</el-button
      >
      <el-button id="clear-button" @click="clearNet">清空</el-button>
      <el-checkbox v-model="nodeLabels">显示节点名</el-checkbox>
      <el-checkbox v-model="linkLabels"> 显示关系名</el-checkbox>
    </el-row>
    <el-row>
      <d3-network
        :net-nodes="nodes"
        :net-links="links"
        :options="options"
        @node-click="nodeClick"
        @link-click="linkClick"
      />
      <div class="tools">
        <ul>
          <li v-for="(t, to) in tools" :key="to">
            <button
              class="circle"
              @click="setTool(to)"
              :class="buttonClass(to)"
            >
              <span>{{ t.value }}</span>
            </button>
          </li>
        </ul>
        <div class="tip">{{ tools[tool].tip }}</div>
      </div>
    </el-row>
    <el-row>
      <div class="sliders">
        <div class="size-slider">
          <span class="demonstration">节点尺寸</span>
          <el-slider
            :min="5"
            :max="30"
            v-model="nodeSize"
            class="size-slider-item"
          ></el-slider>
        </div>
        <div class="size-slider">
          <span class="demonstration">连线尺寸</span>
          <el-slider
            :min="1"
            :max="20"
            v-model="linkWidth"
            class="size-slider-item"
          ></el-slider>
        </div>
      </div>
    </el-row>
    <el-dialog
      :title="dialogType + '详情'"
      :visible.sync="dialogVisible"
      width="30%"
    >
      <el-table :data="dialogProperties" stripe style="width: 100%">
        <el-table-column prop="label" label="属性" align="center">
        </el-table-column>
        <el-table-column prop="value" label="值" align="center">
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import D3Network from "vue-d3-network";
import axios from "axios";
import { Notification } from "element-ui";

export default {
  components: {
    D3Network,
  },
  data() {
    return {
      disable_search: true,
      currentItem: "",
      loading: false,
      lastLinkId: 0,
      dialogType: "",
      dialogVisible: false,
      dialogProperties: [],
      tool: "pointer",
      tools: {
        pointer: {
          tip: "拖放图例",
          value: "P",
        },
        checker: {
          tip: "查看详情",
          value: "C",
        },
        expander: {
          tip: "进行扩展",
          value: "E",
        },
        fixer: {
          tip: "固定位置",
          value: "F",
        },
      },
      suggestions: [],
      auto_complete_state: "",
      timeout: null,
      nodes: [],
      links: [],
      canvas: false,
      nodeSize: 20,
      linkWidth: 5,
      nodeLabels: true,
      linkLabels: true,
      select_options: [
        {
          value: "person",
          label: "个人",
        },
        {
          value: "organization",
          label: "企业",
        },
      ],
      selected_value: "organization",
    };
  },
  computed: {
    options() {
      return {
        canvas: this.canvas,
        nodeSize: this.nodeSize,
        linkWidth: this.linkWidth,
        nodeLabels: this.nodeLabels,
        linkLabels: this.linkLabels,
      };
    },
  },
  methods: {
    selectChange() {
      this.auto_complete_state = "";
      this.disable_search = true;
    },
    querySearchAsync(queryString, cb) {
      this.disable_search = true;
      if (!queryString) {
        queryString = "";
      }
      axios({
        method: "POST",
        baseURL: process.env.VUE_APP_API_BASE_URL,
        url:
          "/auto?queryString=" + queryString + "&type=" + this.selected_value,
        timeout: 6000,
      }).then(
        (response) => {
          console.log(response.data);
          if (response.data.success) {
            let results = response.data.results;
            for (let result of results) {
              result.value = result.name;
            }
            cb(results);
          } else {
            Notification.error({
              title: "出错啦",
              message: "请求格式有误",
              duration: 2000,
            });
            cb([]);
          }
        },
        () => {
          Notification.error({
            title: "网络中断",
            message: "请求自动补全失败",
            duration: 2000,
          });
          cb([]);
        }
      );
    },
    queryByButton() {
      let id = this.currentItem.identity;
      this.addNode(id, this.currentItem.name, this.selected_value, null);
      if (this.selected_value === "person") {
        this.getOrganizationFromPerson(id, null);
      } else {
        this.getPersonFromOrganization(id, null);
      }
    },
    queryPerson(id) {
      this.loading = true;
      axios({
        method: "POST",
        baseURL: process.env.VUE_APP_API_BASE_URL,
        url: "/getPersonById?Id=" + id,
        timeout: 6000,
      }).then(
        (response) => {
          this.loading = false;
          console.log(response.data);
          if (response.data.success) {
            let result = response.data.results;
            if (result.degree) {
              let degreeTranslation = "";
              if (result.degree === "Bachelor") {
                degreeTranslation = "学士学位";
              } else if (result.degree === "Master") {
                degreeTranslation = "硕士学位";
              } else {
                degreeTranslation = "博士学位";
              }
              this.dialogProperties.push({
                name: "degree",
                label: "学位",
                value: degreeTranslation,
              });
            }
            if (result.properties && result.properties["preferred-name"]) {
              this.dialogProperties.push({
                name: "preferredName",
                label: "昵称",
                value: result.properties["preferred-name"],
              });
            }
            this.dialogProperties.push({
              name: "degreeCentrality",
              label: "度中心性",
              value: result.degreeCentrality,
            });
            this.dialogProperties.push({
              name: "betweennessCentrality",
              label: "介数中心性",
              value: result.betweennessCentrality,
            });
            this.dialogProperties.push({
              name: "pageRank",
              label: "PageRank 影响力",
              value: result.pageRank,
            });
            this.dialogProperties.push({
              name: "score",
              label: "总分",
              value: result.score,
            });
            this.dialogVisible = true;
          } else {
            Notification.error({
              title: "出错啦",
              message: "请求格式有误",
              duration: 2000,
            });
          }
        },
        () => {
          this.loading = false;
          Notification.error({
            title: "网络中断",
            message: "请求个人详情失败",
            duration: 2000,
          });
        }
      );
    },
    queryOrganization(id) {
      this.loading = true;
      axios({
        method: "POST",
        baseURL: process.env.VUE_APP_API_BASE_URL,
        url: "/getOrganizationById?Id=" + id,
        timeout: 6000,
      }).then(
        (response) => {
          this.loading = false;
          console.log(response.data);
          if (response.data.success) {
            let result = response.data.results;
            if (result.properties && result.properties.HeadquartersAddress) {
              this.dialogProperties.push({
                name: "headquartersAddress",
                label: "总部位置",
                value: result.properties.HeadquartersAddress.trim(),
              });
            }
            this.dialogProperties.push({
              name: "degreeCentrality",
              label: "度中心性",
              value: result.degreeCentrality,
            });
            this.dialogProperties.push({
              name: "betweennessCentrality",
              label: "介数中心性",
              value: result.betweennessCentrality,
            });
            this.dialogProperties.push({
              name: "pageRank",
              label: "PageRank 影响力",
              value: result.pageRank,
            });
            this.dialogProperties.push({
              name: "score",
              label: "总分",
              value: result.score,
            });
            this.dialogVisible = true;
          } else {
            Notification.error({
              title: "出错啦",
              message: "请求格式有误",
              duration: 2000,
            });
          }
        },
        () => {
          this.loading = false;
          Notification.error({
            title: "网络中断",
            message: "请求企业详情失败",
            duration: 2000,
          });
        }
      );
    },
    getOrganizationFromPerson(id, node) {
      this.loading = true;
      axios({
        method: "POST",
        baseURL: process.env.VUE_APP_API_BASE_URL,
        url: "/getOrganizationFromPerson?id=" + id,
        timeout: 6000,
      }).then(
        (response) => {
          this.loading = false;
          console.log(response.data);
          if (response.data.success) {
            let results = response.data.results;
            for (let result of results) {
              this.addNode(result.identity, result.name, "organization", node);
            }
            for (let result of results) {
              this.addLink(result.relationship, id, result.identity);
            }
          } else {
            Notification.error({
              title: "出错啦",
              message: "请求格式有误",
              duration: 2000,
            });
          }
        },
        () => {
          this.loading = false;
          Notification.error({
            title: "网络中断",
            message: "单点企业查询失败",
            duration: 2000,
          });
        }
      );
    },
    getPersonFromOrganization(id, node) {
      this.loading = true;
      axios({
        method: "POST",
        baseURL: process.env.VUE_APP_API_BASE_URL,
        url: "/getPersonFromOrganization?id=" + id,
        timeout: 6000,
      }).then(
        (response) => {
          this.loading = false;
          console.log(response.data);
          if (response.data.success) {
            let results = response.data.results;
            for (let result of results) {
              this.addNode(result.identity, result.name, "person", node);
            }
            for (let result of results) {
              this.addLink(result.relationship, id, result.identity);
            }
            console.log(this.links);
          } else {
            Notification.error({
              title: "出错啦",
              message: "请求格式有误",
              duration: 2000,
            });
          }
        },
        () => {
          this.loading = false;
          Notification.error({
            title: "网络中断",
            message: "单点个人查询失败",
            duration: 2000,
          });
        }
      );
    },
    handleSelect(item) {
      (this.disable_search = false), console.log(this.currentItem);
      this.currentItem = item;
    },
    setTool(tool) {
      this.tool = tool;
      let cursorClass = tool === "pointer" ? "" : "crosshair";
      let svgField = document.querySelector(".net");
      svgField.style.cursor = cursorClass;
    },
    buttonClass(tool) {
      if (tool === this.tool) return "selected";
    },
    addNode(id, name, type, node) {
      let color = "";
      if (type === "person") {
        color = "orange";
      } else {
        color = "green";
      }
      let nNode = { id: id, name: name, type: type, _color: color };
      if (!this.nodes.find((node) => node.id === id)) {
        if (node !== null) {
          nNode.x = node.x + 50;
          nNode.y = node.y + 50;
        }
        this.nodes.push(nNode);
      }
    },
    addLink(name, node_s, node_t) {
      let nLink = { id: this.lastLinkId, sid: node_s, tid: node_t, name: name };
      if (
        !this.links.find(
          (link) =>
            link.sid === node_s && link.tid === node_t && link.name === name
        )
      ) {
        this.lastLinkId++;
        this.links.push(nLink);
      }
    },
    clearNet() {
      this.nodes.splice(0, this.nodes.length);
      this.links.splice(0, this.links.length);
      this.lastLinkId = 0;
    },
    nodeClick(event, node) {
      switch (this.tool) {
        case "checker":
          this.dialogProperties.splice(0, this.dialogProperties.length);
          this.dialogProperties.push({
            name: "name",
            label: "名称",
            value: node.name,
          });
          this.dialogProperties.push({
            name: "id",
            label: "编号",
            value: node.id,
          });
          if (node.type === "person") {
            this.dialogType = "个人节点";
            this.queryPerson(node.id);
          } else {
            this.dialogType = "企业节点";
            this.queryOrganization(node.id);
          }
          break;
        case "expander":
          if (node.type === "person") {
            this.getOrganizationFromPerson(node.id, node);
          } else {
            this.getPersonFromOrganization(node.id, node);
          }
          break;
        case "fixer":
          this.pinNode(node);
          break;
        default:
          // pointer
          break;
      }
    },
    linkClick(event, link) {
      if (this.tool === "checker") {
        this.dialogProperties.splice(0, this.dialogProperties.length);
        this.dialogType = "关系";
        this.dialogProperties.push({
          name: "name",
          label: "名称",
          value: link.name,
        });
        this.dialogProperties.push({
          name: "id",
          label: "编号",
          value: link.id,
        });
        this.dialogVisible = true;
      }
    },
    pinNode(node) {
      if (!node.pinned) {
        node.pinned = true;
        node.fx = node.x;
        node.fy = node.y;
      } else {
        node.pinned = false;
        node.fx = null;
        node.fy = null;
      }
      this.nodes[node.index] = node;
    },
  },
};
</script>

<style src="vue-d3-network/dist/vue-d3-network.css"></style>
<style>
.el-row {
  margin-bottom: 20px;
}
.size-slider {
  width: 20%;
  margin: auto;
}
#search-button {
  margin-left: 2em;
}
#clear-button {
  margin-right: 2em;
}
.el-select {
  margin-right: 2em;
}
.net {
  background-color: #eeeeee;
}
.circle {
  width: 4em;
  height: 4em;
  font-weight: bold;
  border-radius: 50%;
  border: 2px solid #1aad8d;
}
.tools {
  position: absolute;
  bottom: 3em;
  right: 4em;
  z-index: 101;
  text-align: center;
}
.tools ul {
  list-style: none;
  margin: 0 0.5em 0.5em 0;
  padding: 0;
}
.tools ul li {
  display: inline;
  margin-left: 0.5em;
}
.tools ul button {
  width: 3em;
  height: 3em;
  padding: 0;
}
.tools ul button:hover {
  border-color: #caa455;
}
.tools ul button span {
  font-size: 2.5em;
  line-height: 1em;
  color: #1aad8d;
}
.tools ul button span:hover {
  color: #caa455;
}
.tools .selected {
  border-color: #caa455;
}
.tools .selected span {
  color: #caa455;
}
</style>