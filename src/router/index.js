import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';
import Login from '../views/Login';
console.log(store.state.loginState);
const routes = [
  {
    path: '/',
    name: 'login',
    component: Login,
  },
  {
    path: '/login',
    name: 'Login',

    component: () => import('../views/Login'),
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/Chat'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});
console.log('router', router);
router.beforeEach((to, from, next) => {
  let loginState = store.state.loginState;
  if (to.path === '/login' || to.path === '/') {
    next();
  } else {
    if (loginState) {
      next();
    } else {
      next('/login');
    }
  }
});
export default router;
