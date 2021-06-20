import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './plugins/element.js'

Vue.config.productionTip = false

import { Autocomplete, Row, Button, Select, Option } from 'element-ui'

Vue.use(Autocomplete)
Vue.use(Button)
Vue.use(Row)
Vue.use(Select)
Vue.use(Option)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
