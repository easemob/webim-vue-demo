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
          requiresAuth: true,
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
          requiresAuth: true,
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
  console.log('router.from', from, 'router.to', to);
  NProgress.start();
  const loginState = store.state.loginState;
  const EASEIM_loginUser = window.localStorage.getItem('EASEIM_loginUser');
  const loginUserFromStorage = JSON.parse(EASEIM_loginUser) || {};
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    //需要登陆
    if (loginUserFromStorage.user && loginUserFromStorage.accessToken) {
      //token存在，放行
      next();
      NProgress.done();
    } else {
      //token不存在，跳转登陆页面
      //query: {redirect: to.fullPath}：标记跳转之前的路由，并设置为参数传递过去
      next({ path: '/login', query: { redirect: to.fullPath } });
      NProgress.done();
    }
  } else {
    next();
    NProgress.done();
  }
});
export default router;
