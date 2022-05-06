import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login';

const routes = [
  {
    path: '/',
    name: 'login',
    component: Login,
  },
  {
    path: '/login',
    name: 'Login',

    component: () => import(/* webpackChunkName: "about" */ '../views/Login'),
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import(/* webpackChunkName: "about" */ '../views/Chat'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
