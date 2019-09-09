// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import vant from 'vant';
import WebIM from './utils/WebIM';
import store from './store';

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(ElementUI).use(vant)
Vue.config.productionTip = false

/* eslint-disable no-new */
window.Vue = new Vue({
    el: '#app',
    router,
    components: { App },
    template: '<App/>',
    store,
    render: h => h(App)
})