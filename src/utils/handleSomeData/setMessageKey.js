/* 用作根据消息类型处理对象中的key */
import { EMClient } from '@/IM';
import { CHAT_TYPE } from '@/IM/constant';
export default function (msgBody) {
  const loginUserId = EMClient.user;
  const listKey =
    msgBody.chatType === CHAT_TYPE.SINGLE
      ? msgBody.to === loginUserId
        ? msgBody.from
        : msgBody.to
      : msgBody.to;

  return listKey;
}
