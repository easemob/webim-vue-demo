//引入环信SDK
import EaseChatSDK from 'easemob-websdk';
import {
  DEFAULT_EASEMOB_APPKEY,
  DEFAULT_EASEMOB_SOCKET_URL,
  DEFAULT_EASEMOB_REST_URL
} from './config';

// 读取自定义配置（因demo需要自定义配置，非必须）
const webimConfig = window.localStorage.getItem('webimConfig');
const CUSTOM_CONFIG = (webimConfig && JSON.parse(webimConfig)) || {
  appKey: '1190250126193957',
  imServer: 'im-api-v2.easecdn.com',
  restServer: 'im-api-v2.easemob.com'
};

console.log('>>>>>>webimConfig', CUSTOM_CONFIG);

// 实例化环信SDK
const EaseChatClient = new EaseChatSDK.connection({
  appKey: CUSTOM_CONFIG.appKey ? CUSTOM_CONFIG.appKey : DEFAULT_EASEMOB_APPKEY,
  isHttpDNS: !CUSTOM_CONFIG.isPrivate, // 取反isPrivate
  url: CUSTOM_CONFIG.imServer ? CUSTOM_CONFIG.imServer : DEFAULT_EASEMOB_SOCKET_URL,
  apiUrl: CUSTOM_CONFIG.restServer ? `${CUSTOM_CONFIG.restServer}:${CUSTOM_CONFIG.port}` : DEFAULT_EASEMOB_REST_URL
});

export { EaseChatSDK, EaseChatClient };
