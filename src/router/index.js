import Vue from 'vue'
import Router from 'vue-router';
import Login from '../pages/login/index.vue';
import Contact from '../pages/chat/index.vue';

Vue.use(Router)

export default new Router({
    mode: 'history',
    routes: [
        { 
            path: '',
            redirect: '/contact'
        },
        { 
            path: '/',
            redirect: '/contact'
        },
        {
            path: '/login',
            name: 'Login',
            component: Login
        },
        {
            path: '/register',
            name: 'Login',
            component: Login
        },
        {
            path: '/contact',
            name: 'Contact',
            component: Contact
        }
    ]
})
