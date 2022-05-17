// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';
import router from './router';
import WebIM from './utils/WebIM';
import store from './store';

import Antd from './utils/antd-vue';

import Router from 'vue-router';

Vue.config.productionTip = false;
Vue.use(Antd);

const originalPush = Router.prototype.push;
Router.prototype.push = function push(location){
	return originalPush.call(this, location)['catch'](err => err);
};

Vue.config.productionTip = false;

/* eslint-disable no-new */
window.Vue = new Vue({
	el: '#app',
	router,
	components: { App },
	template: '<App/>',
	store,
	WebIM,
	render: h => h(App)
});
