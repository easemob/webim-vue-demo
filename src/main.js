import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import EasemobChatCallKit from 'easemob-chat-callkit-vue3';
import 'easemob-chat-callkit-vue3/style.css';

import ElementPlus from 'element-plus';
import './styles/element/index.scss';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
createApp(App)
  .use(store)
  .use(router)
  .use(ElementPlus, { locale: zhCn })
  .use(EasemobChatCallKit)
  .mount('#app');
