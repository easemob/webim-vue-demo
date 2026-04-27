/**
 * 环信 IM 配置文件
 * 
 * 快速开始:
 * 1. 只需修改 EASEMOB_APPKEY 即可使用用户名密码登录
 * 2. 如需使用私有化部署,修改对应的服务器地址
 * 
 * 配置项说明:
 * - EASEMOB_APPKEY: 环信应用的 AppKey (必填)
 * - EASEMOB_SOCKET_URL: WebSocket 服务地址 (可选,使用私有化部署时填写)
 * - EASEMOB_REST_URL: REST API 服务地址 (可选,使用私有化部署时填写)
 * - IS_PRIVATE_DEPLOYMENT: 是否使用私有化部署 (设置为 true 时需要配置上述服务器地址)
 * 
 * 更多说明请查看: ./README.md
 */

// ============ 基础配置 ============
// 优先从环境变量读取，降级到默认配置
export const EASEMOB_APPKEY = process.env.VUE_APP_IMAPPKEY || 'easemob-demo#support';

// ============ 私有化部署配置 (可选) ============
// 是否使用私有化部署
export const IS_PRIVATE_DEPLOYMENT = false;

// 私有化部署服务器地址 (仅在 IS_PRIVATE_DEPLOYMENT 为 true 时生效)
export const EASEMOB_SOCKET_URL = '';
export const EASEMOB_REST_URL = '';


