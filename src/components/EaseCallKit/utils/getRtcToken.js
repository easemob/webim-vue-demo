/** @deprecated EaseCallKit 已废弃，请使用 easemob-chat-callkit-vue3 替代。该组件不再维护，仅保留作参考。 */

/**
 * 请求频道Token
 * 【✅ SDK内置方法】使用环信SDK 4.17.0+ 内置的 getRTCToken 方法获取，无需额外HTTP请求。
 * 参考文档：https://doc.easemob.com/apidoc/web/modules/Contact.html#getRTCToken
 * @param {Object} CallKitEMClient - 环信IM客户端实例（原 EaseIMConn）
 * @param {string} channelName - 频道名称，传 '*' 为通配符生成万能Token
 * @returns {Promise<{appId: string, RTCUId: number, RTCToken: string} | null>}
 */
export async function requestRtcChannelToken(CallKitEMClient, channelName) {
  try {
    const res = await CallKitEMClient.getRTCToken(channelName);
    return res.data;
  } catch (error) {
    throw error;
  }
}

/**
 * 请求频道内uid与环信id的映射关系
 * 【✅ SDK内置方法】使用环信SDK 4.17.0+ 内置的 getUserIdByRTCUIds 方法获取，无需额外HTTP请求。
 * 参考文档：https://doc.easemob.com/apidoc/web/modules/Contact.html#getUserIdByRTCUIds
 * @param {Object} CallKitEMClient - 环信IM客户端实例（原 EaseIMConn）
 * @param {number[]} RTCUIds - 频道内RTC uid列表（number类型数组）
 * @returns {Promise<AsyncResult<Record<number, string>>>} uid与环信ID的映射
 */
export async function requestInChannelMapHxId(CallKitEMClient, RTCUIds) {
  try {
    const res = await CallKitEMClient.getUserIdByRTCUIds(RTCUIds);
    return res;
  } catch (error) {
    throw error;
  }
}
