import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import ElementPlus from 'element-plus';
import './styles/element/index.scss';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

/* 自定义指令 */
import textOverflow from '@/directives/textOverflow';

const app = createApp(App)
  .directive('textOverflow', {
    mounted(el) {
      // 聚焦元素
      textOverflow(el);
    },
  })
  .use(store)
  .use(router)
  .use(ElementPlus, { locale: zhCn })
  .mount('#app');

console.log('>>>>App', app);
