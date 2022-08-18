import EaseIM from '@/IM/initwebsdk';
import {
  handleSDKErrorNotifi,
  setMessageKey,
  createMessage,
} from '@/utils/handleSomeData';
import _ from 'lodash';
import { ref, toRaw } from 'vue';
import { messageType } from '@/constant';
const { CHAT_TYPE,ALL_MESSAGE_TYPE } = messageType;
const Message = {
  state: {
    messageList: ref({}),
  },
  mutations: {
    UPDATE_MESSAGE_LIST: (state, msgBody) => {
      const toUpdateMsgList = _.assign({}, state.messageList);
      const listKey = setMessageKey(msgBody);
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
    },
    //清除某条会话消息
    CLEAR_SOMEONE_MESSAGE: (state, payload) => {
      state.messageList[payload] = [];
    },
    //撤回删除消息
    CHANGE_MESSAGE_BODAY: (state, payload) => {
      const { type, key, mid } = payload;
      if (type === 'recall') {
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
      let key = setMessageKey(params);
      commit('UPDATE_MESSAGE_LIST', params);
      dispatch('gatherConversation', key);
    },
    //获取历史消息
    getHistoryMessage: async ({ dispatch, commit }, params) => {
      const { id, chatType, cursor } = params;
      return new Promise(async (resolve, reject) => {
        let options = {
          targetId: id,
          pageSize: 10,
          cursor: cursor,
          chatType: chatType,
          searchDirection: 'up',
        };
        try {
          let { cursor, messages } = await EaseIM.conn.getHistoryMessages(
            options
          );
          messages.length > 0 &&
            messages.forEach((item) => {
              item.read = true;
            });
          resolve({ messages, cursor });
          commit('UPDATE_HISTORY_MESSAGE', {
            listKey: id,
            historyMessage: _.reverse(messages),
          });
          //提示会话列表更新
          dispatch('gatherConversation', id);
        } catch (error) {
          reject(error);
        }
      });
    },
    //发送展示类型消息
    sendShowTypeMessage: async ({ dispatch, commit }, params) => {
      let options = createMessage.createOptions(params);
      return new Promise(async (resolve, reject) => {
        let msg = WebIM.message.create(options);
        try {
          let { serverMsgId } = await EaseIM.conn.send(msg);
          console.log('>>>>发送成功', msg);
          msg.id = serverMsgId;
          msg.from = EaseIM.conn.user;
          let msgBody = createMessage.createMsgBody(msg);
          commit('UPDATE_MESSAGE_LIST', msgBody);
          // 提示会话列表更新
          dispatch('gatherConversation', msgBody.to);
          resolve('OK');
        } catch (error) {
          handleSDKErrorNotifi(error.type, error.message);
          reject(error);
          console.log('>>>>>>发送失败', error);
        }
      });
    },
    //添加通知类消息
    createInformMessage: ({dispatch,commit},params)=>{
      let msgBody = _.cloneDeep(params)
      msgBody.type = ALL_MESSAGE_TYPE.INFORM
      let key = setMessageKey(params);
     console.log('>>>>>>添加系统消息',params);
     commit('UPDATE_MESSAGE_LIST', msgBody);
     dispatch('gatherConversation', key);
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
          handleSDKErrorNotifi(error.type, error.message);
          console.log('>>>>>>撤回消息error', error);
          reject(error);
        }
      });
    },
  },
};
export default Message;
