import { createRouter, createWebHistory } from 'vue-router';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'; // progress bar style
import store from '@/store';
import Login from '../views/Login';
console.log(store.state.loginState);
const routes = [
  {
    path: '/',
    name: 'login',
    component: Login,
  },
  /* 登陆页 */
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login'),
    meta: {
      title: '登陆环信',
    },
  },
  /* 聊天页 */
  {
    path: '/chat',
    name: 'Chat',
    redirect: '/chat/conversation',
    component: () => import('../views/Chat'),
    meta: {
      title: '开始聊天',
    },
    children: [
      /* 会话列表 */
      {
        path: 'conversation',
        name: 'Conversation',
        meta: {
          title: '会话',
          keepAlive: false,
        },
        component: () => import('../views/Chat/components/Conversation'),
        children: [
          //系统通知详情框
          {
            path: 'informdetails',
            component: () => import('../views/Chat/components/InformDetails'),
          },
          //聊天对话框
          {
            path: 'message',
            component: () => import('../views/Chat/components/Message'),
          },
        ],
      },
      /* 联系人页 */
      {
        path: 'contacts',
        name: 'Contacts',
        meta: {
          title: '联系页',
          keepAlive: true,
        },
        component: () => import('../views/Chat/components/Contacts'),
        children: [
          {
            path: 'message',

            component: () => import('../views/Chat/components/Message'),
          },
          //系统通知详情框
          {
            path: 'informdetails',
            component: () => import('../views/Chat/components/InformDetails'),
          },
          {
            path: 'contactInfo',
            component: () =>
              import(
                '../views/Chat/components/Contacts/components/contactInfo.vue'
              ),
          },
        ],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});
router.beforeEach((to, from, next) => {
  NProgress.start();
  const loginState = store.state.loginState;
  const EASEIM_loginUser = window.localStorage.getItem('EASEIM_loginUser');
  const loginUserFromStorage = JSON.parse(EASEIM_loginUser) || {};
  if (to.path === '/login' || to.path === '/') {
    next();
    NProgress.done();
  } else {
    if (loginState) {
      next();
      NProgress.done();
    } else if (loginUserFromStorage?.user && loginUserFromStorage?.token) {
      next();
      NProgress.done();
    } else {
      next('/login');
      NProgress.done();
    }
  }
});
export default router;
