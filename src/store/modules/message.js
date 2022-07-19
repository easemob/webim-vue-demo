import EaseIM from '@/IM/initwebsdk';
import { useSetMessageKey, useCreateMessage, useSDKErrorNotifi } from '@/hooks';
import _ from 'lodash';
import { ref, toRaw } from 'vue';
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
    //清除某条会话消息
    CLEAR_SOMEONE_MESSAGE: (state, payload) => {
      console.log('>>>>>执行清屏', payload);
      state.messageList[payload] = [];
    },
    //撤回删除消息
    CHANGE_MESSAGE_BODAY: (state, payload) => {
      console.log('>>>>>>撤回删除消息', payload);

      const { type, key, mid } = payload;
      if (type === 'recall') {
        console.log('>>>>>>>准备开始撤回', state.messageList[key]);
        if (state.messageList[key]) {
          let res = _.find(state.messageList[key], (o) => o.id === mid);
          res.isRecall = true;
        }
      }
      if (type === 'deleteMsg') {
        if (state.messageList[key]) {
          let sourceData = toRaw(state.messageList[key]);
          let index = _.findIndex(state.messageList[key], (o) => o.id === mid);
          sourceData.splice(index, 1);
          state.messageList[key] = _.assign([], sourceData);
        }
      }
    },
  },
  actions: {
    //添加新消息
    createNewMessage: ({ dispatch, commit }, params) => {
      let key = useSetMessageKey(params);
      commit('UPDATE_MESSAGE_LIST', params);
      dispatch('gatherConversation', key);
    },
    //获取历史消息
    getHistoryMessage: async ({ dispatch, commit }, params) => {
      console.log('>>>>>>>>>>params', params);
      const { id, chatType } = params;
      return new Promise(async (resolve, reject) => {
        let options = {
          queue: id, //需特别注意：如果 queue 属性值为大小写字母混合输入或全部大写会导致拉取漫游为空数组，因此需将属性值转换为全部小写。
          isGroup: chatType === CHAT_TYPE.GROUP,
          format: true,
          count: 10,
        };
        try {
          let historyMessage = await EaseIM.conn.fetchHistoryMessages(options);
          historyMessage.length > 0 &&
            historyMessage.forEach((item) => {
              item.read = true;
            });
          resolve(historyMessage);
          commit('UPDATE_HISTORY_MESSAGE', { listKey: id, historyMessage });
          //提示会话列表更新
          dispatch('gatherConversation', id);
        } catch (error) {
          reject(error);
        }
      });
    },
    //发送展示类型消息
    sendShowTypeMessage: async ({ dispatch, commit }, params) => {
      console.log('params', params);
      let options = useCreateMessage.createOptions(params);
      console.log('>>>>>>sendShowTypeMessage,options', options);
      return new Promise(async (resolve, reject) => {
        let msg = WebIM.message.create(options);
        try {
          let { serverMsgId } = await EaseIM.conn.send(msg);
          console.log('>>>>发送成功', msg);
          msg.id = serverMsgId;
          msg.from = EaseIM.conn.user;
          let msgBody = useCreateMessage.createMsgBody(msg);
          console.log('>>>>>>返回的msgBody', msgBody);
          commit('UPDATE_MESSAGE_LIST', msgBody);
          // 提示会话列表更新
          dispatch('gatherConversation', msgBody.to);
          resolve('OK');
        } catch (error) {
          useSDKErrorNotifi(error.type, error.message);
          reject(error);
          console.log('>>>>>>发送失败', error);
        }
      });
    },
    //撤回消息
    recallMessage: async ({ dispatch, commit }, params) => {
      const { mid, to, chatType } = params;
      return new Promise(async (resolve, reject) => {
        try {
          await EaseIM.conn.recallMessage({ mid, to, chatType });
          commit('CHANGE_MESSAGE_BODAY', { type: 'recall', key: to, mid });
          dispatch('gatherConversation', to);
          resolve('OK');
        } catch (error) {
          useSDKErrorNotifi(error.type, error.message);
          console.log('>>>>>>撤回消息error', error);
          reject(error);
        }
      });
    },
  },
};
export default Message;
