import EaseIM from '@/IM/initwebsdk';
import { useSetMessageKey } from '@/hooks';
import _ from 'lodash';
import { ref } from 'vue';
const Message = {
  state: {
    messageList: ref({}),
  },
  mutations: {
    UPDATE_MESSAGE_LIST: (state, msgBody) => {
      const toUpdateMsgList = _.assign({}, state.messageList);
      const listKey = useSetMessageKey(msgBody);
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
    //添加新消息
    createNewMessage: ({ commit }, params) => {
      commit('UPDATE_MESSAGE_LIST', params);
    },
  },
};
export default Message;
