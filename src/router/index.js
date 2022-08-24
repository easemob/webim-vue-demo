import Vue from 'vue';
import Router from 'vue-router';
import Login from '../pages/login/index.vue';
import ResetPassword from '../pages/resetpassword/index.vue';
import Contact from '../pages/chat/index.vue';

Vue.use(Router);

export default new Router({
	mode: 'history',
	routes: [
		{
			path: '',
			redirect: '/login'
		},
		{
			path: '/',
			redirect: '/login'
		},
		{
			path: '/login',
			name: 'login',
			component: Login
		},
		{
			path: '/register',
			name: 'login',
			component: Login
		},
		{
			path: '/resetpassword',
			name: 'resetpassword',
			component: ResetPassword
		},
		{
			path: '/contact/:id',
			name: 'contact',
			component: Contact
		},
		{
			path: '/contact',
			name: 'contact',
			component: Contact
		},
		{
			path: '/group/:id',
			name: 'group',
			component: Contact
		},
		{
			path: '/group',
			name: 'group',
			component: Contact
		},
		{
			path: '/chatroom/:id',
			name: 'chatroom',
			component: Contact
		},
		{
			path: '/chatroom',
			name: 'chatroom',
			component: Contact
		},
	]
});
