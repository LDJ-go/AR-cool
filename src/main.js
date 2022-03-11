import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
  beforeCreate() {
    //生命周期钩子
    Vue.prototype.$bus = this; //安装全局事件总线
  },
}).$mount('#app')
