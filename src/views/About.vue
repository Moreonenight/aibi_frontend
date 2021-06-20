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
      <el-button type="primary" :loading="false" id="search-button"
        >搜索</el-button
      >
      <el-button :loading="false" id="test-button" @click="addNode()"
        >加点</el-button
      >      
    </el-row>
    <br />
    <d3-network :net-nodes="nodes" :net-links="links" :options="options" />
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
  </div>
</template>

<script>
import D3Network from "vue-d3-network";
export default {
  components: {
    D3Network,
  },
  data() {
    return {
      tool: "pointer",
      tools: {
        pointer: {
          tip: "选中节点查看详情",
          value: "P"
        },
        expander: {
          tip: "点击节点进行扩展",
          value: "E"
        },
        fixxer: {
          tip: "点击节点固定位置",
          value: "F"
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
        { tid: 1, sid: 2 },
        { tid: 2, sid: 3 },
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
      selected_value: "",
    };
  },
  methods: {
    querySearchAsync(queryString, cb) {
      var restaurants = this.restaurants;
      var results = queryString
        ? restaurants.filter(this.createStateFilter(queryString))
        : restaurants;

      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        cb(results);
      }, 3000 * Math.random());
    },
    createStateFilter(queryString) {
      return (state) => {
        return (
          state.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
        );
      };
    },
    handleSelect(item) {
      console.log(item);
    },
    setTool(tool) {
      this.tool = tool;
      let cursorClass = tool === "pointer" ? "" : "cross-cursor";
      this.$el.className = cursorClass;
    },
    buttonClass(tool) {
      if (tool === this.tool) return "selected";
    },
    addNode(){
      this.nodes.push({"name": "爬"})
    }
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