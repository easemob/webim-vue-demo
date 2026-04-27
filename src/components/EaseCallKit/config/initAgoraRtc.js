/** @deprecated EaseCallKit 已废弃，请使用 easemob-chat-callkit-vue3 替代。该组件不再维护，仅保留作参考。 */
import AgoraRTC from 'agora-rtc-sdk-ng';

const AgoraAppId = '15cb0d28b87b425ea613fc46f7c9f974';
//设置日志输出等级
AgoraRTC.setLogLevel(3);

export { AgoraAppId, AgoraRTC };
