import EaseIM from '@/IM/initwebsdk';
import { messageType } from '@/constant';
import _ from 'lodash';
import { ref } from 'vue';
const { CHAT_TYPE } = messageType;
const Message = {
  state: {
    messageList: ref({}),
  },
  mutations: {
    UPDATE_MESSAGE_LIST: (state, msgBody) => {
      const toUpdateMsgList = Object.assign({}, state.messageList);
      const loginUserId = EaseIM.conn.user;
      const listKey =
        msgBody.chatType === CHAT_TYPE.SINGLE
          ? msgBody.to === loginUserId
            ? msgBody.from
            : msgBody.to
          : msgBody.to;

      if (!toUpdateMsgList[listKey]) {
        toUpdateMsgList[listKey] = [];
        toUpdateMsgList[listKey].push(msgBody);
      } else {
        toUpdateMsgList[listKey].push(msgBody);
      }
      state.messageList = toUpdateMsgList;
    },
  },
  actions: {
    createNewMessage: ({ commit }, params) => {
      console.log('>>>>执行添加新消息', params, EaseIM.conn.user);
      commit('UPDATE_MESSAGE_LIST', params);
    },
  },
};
export default Message;
