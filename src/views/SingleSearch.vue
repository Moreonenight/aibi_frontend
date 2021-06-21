<template>
  <div class="about">
    <h1>查询数据集</h1>
    <el-row>
      <el-select v-model="selected_value" placeholder="请选择">
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
        >搜索</el-button
      >
      <el-button id="clear-button" @click="clearNet">清空</el-button>
    </el-row>
    <br />
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
          <button class="circle" @click="setTool(to)" :class="buttonClass(to)">
            <span>{{ t.value }}</span>
          </button>
        </li>
      </ul>
      <div class="tip">{{ tools[tool].tip }}</div>
    </div>
    <el-dialog
      :title="dialogType + '详情'"
      :visible.sync="dialogVisible"
      width="30%"
    >
      <ul>
        <li>{{ this.dialogType }}名称：{{ this.dialogName }}</li>
      </ul>
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
      currentItem: "",
      loading: false,
      lastLinkId: 0,
      dialogType: "",
      dialogVisible: false,
      dialogName: "",
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
      nodes: [
        { id: 1, name: "test" },
        { id: 2, name: "test1" },
        { id: 3, name: "test2" },
      ],
      links: [
        { tid: 1, sid: 2, name: "1" },
        { tid: 2, sid: 3, name: "2" },
        { tid: 2, sid: 3, name: "3" },
      ],
      options: {
        canvas: false,
        nodeSize: 20,
        linkWidth: 5,
        nodeLabels: true,
        linkLabels: true,
      },
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
      selected_value: "person",
    };
  },
  methods: {
    querySearchAsync(queryString, cb) {
      if (!queryString) {
        queryString = "";
      }
      axios({
        method: "POST",
        baseURL: process.env.VUE_APP_API_BASE_URL,
        url:
          "/auto?queryString=" + queryString + "&type=" + this.selected_value,
        timeout: 6000,
      })
        .then((response) => {
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
        })
        .catch(() => {
          Notification.error({
            title: "网络中断",
            message: "请求自动补全失败",
            duration: 2000,
          });
          cb([]);
        });
    },
    queryByButton(){
      let id = this.currentItem.identity;
      this.addNode(id, this.currentItem.name, this.selected_value, null)
      if(this.selected_value === "person"){
        this.getOrganizationFromPerson(id, null)
      }
      else{
        this.getPersonFromOrganization(id, null)
      }
    },
    queryPerson(id) {
      this.loading = true;
      axios({
        method: "POST",
        baseURL: process.env.VUE_APP_API_BASE_URL,
        url: "/getPersonById?Id=" + id,
        timeout: 6000,
      })
        .then((response) => {
          this.loading = false;
          console.log(response.data);
          if (response.data.success) {
          } else {
            Notification.error({
              title: "出错啦",
              message: "请求格式有误",
              duration: 2000,
            });
          }
        })
        .catch(() => {
          this.loading = false;
          Notification.error({
            title: "网络中断",
            message: "请求个人详情失败",
            duration: 2000,
          });
        });
    },
    queryOrganization(id) {
      this.loading = true;
      axios({
        method: "POST",
        baseURL: process.env.VUE_APP_API_BASE_URL,
        url: "/getOrganizationById?Id=" + id,
        timeout: 6000,
      })
        .then((response) => {
          this.loading = false;
          console.log(response.data);
          if (response.data.success) {
          } else {
            Notification.error({
              title: "出错啦",
              message: "请求格式有误",
              duration: 2000,
            });
          }
        })
        .catch(() => {
          this.loading = false;
          Notification.error({
            title: "网络中断",
            message: "请求企业详情失败",
            duration: 2000,
          });
        });
    },
    getOrganizationFromPerson(id, node) {
      this.loading = true;
      axios({
        method: "POST",
        baseURL: process.env.VUE_APP_API_BASE_URL,
        url: "/getOrganizationFromPerson?id=" + id,
        timeout: 6000,
      })
        .then((response) => {
          this.loading = false;
          console.log(response.data);
          if (response.data.success) {
            let results = response.data.results;
            for (let result of results) {
              this.addNode(result.identity, result.name, "organization" , node);
            }
            for (let result of results) {
              this.addLink(result.relationship, node.id, result.identity);
            }
          } else {
            Notification.error({
              title: "出错啦",
              message: "请求格式有误",
              duration: 2000,
            });
          }
        })
        .catch(() => {
          this.loading = false;
          Notification.error({
            title: "网络中断",
            message: "单点企业查询失败",
            duration: 2000,
          });
        });
    },
    getPersonFromOrganization(id, node) {
      this.loading = true;
      axios({
        method: "POST",
        baseURL: process.env.VUE_APP_API_BASE_URL,
        url: "/getPersonFromOrganization?id=" + id,
        timeout: 6000,
      })
        .then((response) => {
          this.loading = false;
          console.log(response.data);
          if (response.data.success) {
            let results = response.data.results;
            for (let result of results) {
              this.addNode(result.identity, result.name, "person", node);
            }
            for (let result of results) {
              this.addLink(result.relationship, node.id, result.identity);
            }
          } else {
            Notification.error({
              title: "出错啦",
              message: "请求格式有误",
              duration: 2000,
            });
          }
        })
        .catch(() => {
          this.loading = false;
          Notification.error({
            title: "网络中断",
            message: "单点个人查询失败",
            duration: 2000,
          });
        });
    },
    handleSelect(item) {
      console.log(this.currentItem)
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
      let nNode = { id: id, name: name, type: type };
      if (node !== null) {
        nNode.x = node.x + 50;
        nNode.y = node.y + 50;
      }
      this.nodes.concat(nNode);
    },
    addLink(name, node_s, node_t) {
      let nLink = { id: this.lastLinkId, sid: node_s, tid: node_t, name: name };
      this.links.concat(nLink);
    },
    clearNet() {
      this.nodes.splice(0, this.nodes.length);
      this.links.splice(0, this.links.length);
      this.lastLinkId = 0;
    },
    nodeClick(event, node) {
      switch (this.tool) {
        case "checker":
          if(node.type === "person"){
            this.dialogType = "个人节点";
            this.queryPerson
          }
          else{
            this.dialogType = "企业节点";
          }
          this.dialogName = node.name;
          this.dialogVisible = true;
          break;
        case "expander":
          if(node.type === "person"){
            this.getOrganizationFromPerson(node.id, node)
          }
          else{
            this.getPersonFromOrganization(node.id, node)
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
        this.dialogType = "关系";
        this.dialogName = link.name;
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
#search-button {
  margin-left: 2em;
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