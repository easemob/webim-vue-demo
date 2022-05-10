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
    redirect: '/chat/conversation',
    component: () => import('../views/Chat'),
    children: [
      {
        path: 'conversation',
        name: 'Conversation',

        meta: {
          title: '会话',
        },
        component: () => import('../components/Conversation'),
      },
      {
        path: 'contacts',
        name: 'Contacts',
        meta: {
          title: '联系页',
        },
        component: () => import('../components/Contacts'),
      },
    ],
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
