<template>
  <div class="about">
    <h1>查询数据集</h1>
    <d3-network :net-nodes="nodes" :net-links="links" :options="options" />
  </div>
</template>

<script>
import D3Network from 'vue-d3-network'
export default {
  components: {
    D3Network,
  },
  data() {
    return {
      nodes: [{id: 1, name : "test"}, {id: 2, name : "test1"}, {id: 3, name : "test2"}],
      links: [{tid: 1, sid: 2}, {tid: 2, sid: 3}],
      options: {
        canvas: false,
        nodeSize: 20,
        linkWidth: 5,
        nodeLabels: true,
        linkLabels: true,
      },
    }
  }
}
</script>

<style src="vue-d3-network/dist/vue-d3-network.css"></style>