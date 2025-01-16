//MiniCore
import MiniCore from 'easemob-websdk/miniCore/miniCore';
import * as contactPlugin from 'easemob-websdk/contact/contact';
import * as groupPlugin from 'easemob-websdk/group/group';
import * as presencePlugin from 'easemob-websdk/presence/presence';
import * as localCachePlugin from 'easemob-websdk/localCache/localCache';
import {
  DEFAULT_EASEMOB_APPKEY,
  DEFAULT_EASEMOB_SOCKET_URL,
  DEFAULT_EASEMOB_REST_URL,
} from '../config';
let miniCore = {};
const IM_IS_OPEN_CUSTOM_SERVER_CONFIG =
  JSON.parse(window.localStorage.getItem('IM_IS_OPEN_CUSTOM_SERVER_CONFIG')) ||
  false;
const webimConfig = window.localStorage.getItem('webimConfig');
const CUSTOM_CONFIG = (webimConfig && JSON.parse(webimConfig)) || {};
const initEMClient = () => {
  // 读取自定义配置（因demo需要自定义配置，非必须）
  const configOptions = {};
  console.log(
    'IM_IS_OPEN_CUSTOM_SERVER_CONFIG',
    IM_IS_OPEN_CUSTOM_SERVER_CONFIG,
  );
  if (IM_IS_OPEN_CUSTOM_SERVER_CONFIG) {
    Object.assign(configOptions, {
      appKey: CUSTOM_CONFIG.appKey
        ? CUSTOM_CONFIG.appKey
        : DEFAULT_EASEMOB_APPKEY,
      isHttpDNS: !CUSTOM_CONFIG.isPrivate, //取反isPrivate
      url: CUSTOM_CONFIG.imWebsocketServer
        ? CUSTOM_CONFIG.imWebsocketServer
        : DEFAULT_EASEMOB_SOCKET_URL,
      apiUrl: CUSTOM_CONFIG.restServer
        ? `${CUSTOM_CONFIG.restServer}:${CUSTOM_CONFIG.port}`
        : DEFAULT_EASEMOB_REST_URL,
    });
  } else {
    Object.assign(configOptions, {
      appKey: DEFAULT_EASEMOB_APPKEY,
    });
    console.log('configOptions', configOptions);
  }
  miniCore = new MiniCore({ ...configOptions });
  return miniCore;
};
initEMClient();

if (Object.keys(miniCore).length) {
  //注册插件
  miniCore.usePlugin(contactPlugin);
  miniCore.usePlugin(groupPlugin);
  miniCore.usePlugin(presencePlugin);
  miniCore.usePlugin(localCachePlugin, 'localCache');
}
export default miniCore;
