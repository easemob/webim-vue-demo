/* 用作根据消息类型处理对象中的key */
import EaseIM from '@/IM/initwebsdk';
import { messageType } from '@/constant';
const { CHAT_TYPE } = messageType;
export default function (msgBody) {
  const loginUserId = EaseIM.conn.user;
  const listKey =
    msgBody.chatType === CHAT_TYPE.SINGLE
      ? msgBody.to === loginUserId
        ? msgBody.from
        : msgBody.to
      : msgBody.to;

  return listKey;
}
