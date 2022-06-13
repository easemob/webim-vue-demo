import EaseIM from '@/IM/initwebsdk';
import { useSetMessageKey, useCreateMessage } from '@/hooks';
import _ from 'lodash';
import { ref } from 'vue';
import { messageType } from '@/constant';
const { CHAT_TYPE } = messageType;
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
    UPDATE_HISTORY_MESSAGE: (state, payload) => {
      const { listKey, historyMessage } = payload;
      const toUpdateMsgList = _.assign({}, state.messageList);
      if (!toUpdateMsgList[listKey]) {
        toUpdateMsgList[listKey] = [];
        toUpdateMsgList[listKey].push(...historyMessage);
      } else {
        toUpdateMsgList[listKey].unshift(...historyMessage);
      }
      state.messageList = toUpdateMsgList;
      console.log('>>>>>>更新历史消息至messageList', payload);
    },
  },
  actions: {
    //添加新消息
    createNewMessage: ({ commit }, params) => {
      commit('UPDATE_MESSAGE_LIST', params);
    },
    //获取历史消息
    getHistoryMessage: async ({ commit }, params) => {
      console.log('>>>>>>>>>>params', params);
      const { id, chatType } = params;
      let options = {
        queue: id, //需特别注意：如果 queue 属性值为大小写字母混合输入或全部大写会导致拉取漫游为空数组，因此需将属性值转换为全部小写。
        isGroup: chatType === CHAT_TYPE.GROUP,
        format: true,
        count: 10,
      };
      let historyMessage = await EaseIM.conn.fetchHistoryMessages(options);
      commit('UPDATE_HISTORY_MESSAGE', { listKey: id, historyMessage });
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
