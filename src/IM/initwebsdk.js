//引入环信SDK
import Easemob_SDK from 'easemob-websdk';
// 读取自定义配置（因demo需要自定义配置，非必须）

const webimConfig = window.localStorage.getItem('webimConfig');
const CUSTOM_CONFIG = (webimConfig && JSON.parse(webimConfig)) || {};
console.log('>>>>>>webimConfig', CUSTOM_CONFIG);
//环信appKey默认配置项
const DEFAULT_APPKEY = 'easemob-demo#support';
const DEFAULT_URL = `//im-api-v2.easemob.com/ws`;
const DEFAULT_APIURL = `//a1.easemob.com`;
//存放实例化后所有的方法
let EaseIM = {};
window.EaseIM = EaseIM = Easemob_SDK;
//实例化环信SDK
/*
 * isHttpDNS： isPrivate为true开启私有化配置则走自有配置的url以及apiUrl，
 * 否则为true就SDK自助获取DNS地址。
 * 【特别注意】如果不需要私有化配置，也就是自己定义url以及apiUrl。isHttpDNS、url、apiUrl，均可不用填写只用填入appKey！SDK内部会进行自动获取！
 **/
EaseIM.conn = new Easemob_SDK.connection({
  appKey: CUSTOM_CONFIG.appKey ? CUSTOM_CONFIG.appKey : DEFAULT_APPKEY,
  isHttpDNS: !CUSTOM_CONFIG.isPrivate, //取反isPrivate
  url: CUSTOM_CONFIG.imServer ? CUSTOM_CONFIG.imServer : DEFAULT_URL,
  apiUrl: CUSTOM_CONFIG.restServer
    ? `${CUSTOM_CONFIG.restServer}:${CUSTOM_CONFIG.port}`
    : DEFAULT_APIURL,
});
export default EaseIM;
