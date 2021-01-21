// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import vant from 'vant';
import WebIM from './utils/WebIM';
import store from './store';

import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

import Router from 'vue-router'

Vue.config.productionTip = false
Vue.use(Antd)


const originalPush = Router.prototype.push
Router.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(ElementUI).use(vant)
Vue.config.productionTip = false

//拿到初次进入的store初始值
let _setIniteStore = store.state //为了获取到store的初始值以便后期用作退出初始化store；
window.localStorage.setItem('InitStore',window.JSON.stringify(_setIniteStore));
console.log('>>>>>>>_setIniteStore',_setIniteStore);

/* eslint-disable no-new */
window.Vue = new Vue({
    el: '#app',
    router,
    components: { App },
    template: '<App/>',
    store,
    WebIM,
    render: h => h(App)
})