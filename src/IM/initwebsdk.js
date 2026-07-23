import {
  DEFAULT_EASEMOB_APPKEY,
  DEFAULT_EASEMOB_SOCKET_URL,
  DEFAULT_EASEMOB_REST_URL,
  fixSocketUrl,
  fixRestUrl,
} from './config';
// 读取自定义配置（因demo需要自定义配置，非必须）
const webimConfig = window.localStorage.getItem('webimConfig');
const CUSTOM_CONFIG = (webimConfig && JSON.parse(webimConfig)) || {};

const restBase = CUSTOM_CONFIG.restServer
  ? fixRestUrl(CUSTOM_CONFIG.restServer).replace(/\/+$/, '')
  : fixRestUrl(DEFAULT_EASEMOB_REST_URL);
const apiUrlWithPort =
  CUSTOM_CONFIG.restServer && CUSTOM_CONFIG.port
    ? `${restBase}:${String(CUSTOM_CONFIG.port).trim()}`
    : restBase;

// SDK 5.0 的 NGI、VIP6 环境经 DNS 获取与 AppKey 匹配的 REST/WS 地址。
// 旧的 VIP6 本地缓存即使仍标为私有化，也不能继续强制使用历史固定集群。
const useSdkDns =
  !CUSTOM_CONFIG.isPrivate || CUSTOM_CONFIG.environment === 'VIP6';

// 只有明确的私有化环境才固定服务地址，避免将 Token 发往错误集群。
const serviceConfig = !useSdkDns
  ? {
      serverUrls: {
        restApiUrl: apiUrlWithPort,
        wsUrl: fixSocketUrl(
          CUSTOM_CONFIG.imServer || DEFAULT_EASEMOB_SOCKET_URL,
        ),
      },
    }
  : undefined;

export const sdk5Config = {
  appKey: CUSTOM_CONFIG.appKey || DEFAULT_EASEMOB_APPKEY,
  serviceConfig,
};
