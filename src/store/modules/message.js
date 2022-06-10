import EaseIM from '@/IM/initwebsdk';
import { useSetMessageKey, useCreateMessage } from '@/hooks';

import _ from 'lodash';
import { ref } from 'vue';
const Message = {
  state: {
    messageList: ref({}),
  },
  mutations: {
    UPDATE_MESSAGE_LIST: (state, msgBody) => {
      console.log('>>>UPDATE_MESSAGE_LIST>>>', msgBody);
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
    //发送展示类型消息
    sendShowTypeMessage: async ({ commit }, params) => {
      let options = useCreateMessage.createOptions(params);
      return new Promise(async (resolve, reject) => {
        let msg = WebIM.message.create(options);
        try {
          let { serverMsgId } = await EaseIM.conn.send(msg);
          console.log('>>>>发送成功', serverMsgId);
          msg.id = serverMsgId;
          msg.from = EaseIM.conn.user;
          let msgBody = useCreateMessage.createMsgBody(msg);
          console.log(msgBody);
          commit('UPDATE_MESSAGE_LIST', msgBody);
          resolve('OK');
        } catch (error) {
          reject(error);
          console.log('>>>>>>发送失败', error);
        }
      });
    },
  },
};
export default Message;
