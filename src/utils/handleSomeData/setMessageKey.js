/* 用作根据消息类型处理对象中的key */
import { getCurrentUserId } from '@/IM';
import { CHAT_TYPE } from '@/IM/constant';
export default function (msgBody) {
  const loginUserId = getCurrentUserId();

  // 添加空值检查和默认值处理
  if (!msgBody) {
    return 'default';
  }

  // 处理缺少必要属性的情况
  const chatType = msgBody.chatType || 'default';
  const to = msgBody.to || 'default';
  const from = msgBody.from || 'default';

  const listKey =
    chatType === CHAT_TYPE.SINGLE ? (to === loginUserId ? from : to) : to;

  return listKey;
}
