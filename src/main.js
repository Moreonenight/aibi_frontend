import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './plugins/element.js'

Vue.config.productionTip = false

import { Autocomplete, Row, Button, Select, Option, Dialog, Checkbox, Slider } from 'element-ui'

Vue.use(Autocomplete)
Vue.use(Button)
Vue.use(Row)
Vue.use(Select)
Vue.use(Option)
Vue.use(Dialog)
Vue.use(Checkbox)
Vue.use(Slider)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
