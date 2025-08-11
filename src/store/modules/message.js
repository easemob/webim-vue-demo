import { EMClient } from '@/IM';
import { setMessageKey } from '@/utils/handleSomeData';
import _ from 'lodash';
import {
  MESSAGE_STATUS_TYPE,
  CUSTOM_MESSAGE_TYPE,
  CHANGE_MESSAGE_BODAY_TYPE,
  CHAT_TYPE,
  MAX_MESSAGE_LIST_COUNT,
} from '@/constant';
import { usePlayRing } from '@/hooks';
const Message = {
  state: {
    messageList: {},
    messageIdsCollection: {
      // 'pfh':new Map(),
      // 'pfh1':new Map(),
    },
  },
  mutations: {
    UPDATE_MESSAGE_LIST: (state, msgBody) => {
      const { id: serverMsgId } = msgBody;
      const listKey = setMessageKey(msgBody);
      if (!state.messageList[listKey]) {
        state.messageList[listKey] = [];
      }

      state.messageList[listKey] = _.unionBy(
        state.messageList[listKey],
        [msgBody],
        (m) => m.id,
      );
      // 限制数组的长度为 MAX_MESSAGE_LIST_COUNT
      if (state.messageList[listKey].length > MAX_MESSAGE_LIST_COUNT) {
        state.messageList[listKey] = state.messageList[listKey].slice(
          -MAX_MESSAGE_LIST_COUNT,
        );
      }
      /**
       * 暂只实现以单对单已读回执
       * 群组已读回执可通过Reaction方案实现
       */
      if (
        !state.messageIdsCollection[listKey] &&
        msgBody.chatType === CHAT_TYPE.SINGLE
      ) {
        state.messageIdsCollection[listKey] = new Map();
      }
      if (
        msgBody.from === EMClient.user &&
        msgBody.chatType === CHAT_TYPE.SINGLE
      ) {
        state.messageIdsCollection[listKey].set(serverMsgId, {
          [MESSAGE_STATUS_TYPE.READ_STATUS]: false,
        });
      }
    },
    UPDATE_HISTORY_MESSAGE: (state, payload) => {
      const { listKey, historyMessageList } = payload;
      if (!state.messageList[listKey]) {
        state.messageList[listKey] = [];
      }
      state.messageList[listKey] = _.unionBy(
        historyMessageList,
        state.messageList[listKey],
        (m) => m.id,
      );
    },
    UPDATE_MESSAGE_IDS_COLLECTION: (state, payload) => {
      const { id: serverMsgId, key, type } = payload;
      switch (type) {
        case MESSAGE_STATUS_TYPE.READ_STATUS:
          {
            if (state.messageIdsCollection[key]) {
              state.messageIdsCollection[key].set(serverMsgId, {
                [MESSAGE_STATUS_TYPE.READ_STATUS]: true,
              });
            }
          }
          break;
        case MESSAGE_STATUS_TYPE.CHANLE_STATUS:
          {
            if (state.messageIdsCollection[key]) {
              const READ_STATUS_KEY = MESSAGE_STATUS_TYPE.READ_STATUS;
              // 直接使用Map的forEach方法
              state.messageIdsCollection[key].forEach((value, key) => {
                if (value[READ_STATUS_KEY] !== true) {
                  value[READ_STATUS_KEY] = true;
                }
              });
            }
          }
          break;
        default:
          break;
      }
    },
    //清除某条会话消息
    CLEAR_SOMEONE_MESSAGE: (state, payload) => {
      state.messageList[payload] = [];
    },
    //修改本地原消息【撤回、删除、编辑】
    CHANGE_MESSAGE_BODAY: (state, payload) => {
      const { type, key, mid } = payload;
      switch (type) {
        case CHANGE_MESSAGE_BODAY_TYPE.RECALL:
          {
            if (state.messageList[key]) {
              const res = _.find(state.messageList[key], (o) => o.id === mid);
              res.isRecall = true;
            }
          }

          break;
        case CHANGE_MESSAGE_BODAY_TYPE.DELETE:
          {
            if (state.messageList[key]) {
              const sourceData = state.messageList[key];
              const index = _.findIndex(
                state.messageList[key],
                (o) => o.id === mid,
              );
              sourceData.splice(index, 1);
              state.messageList[key] = _.assign([], sourceData);
            }
          }
          break;
        case CHANGE_MESSAGE_BODAY_TYPE.MODIFY:
          {
            if (state.messageList[key]) {
              const res = _.find(state.messageList[key], (o) => o.id === mid);
              _.assign(res, payload?.message);
            }
          }
          break;
        default:
          break;
      }
    },
  },
  actions: {
    //添加新消息
    createNewMessage: ({ dispatch, commit }, params) => {
      const { isOpenPlayRing, playRing } = usePlayRing();
      const key = setMessageKey(params);
      commit('UPDATE_MESSAGE_LIST', params);
      //目前根据全局配置进行新消息声音提示，后续计划根据会话级别可进行设置是否声音提示，比如设定免打扰。
      if (isOpenPlayRing.value) playRing();
      dispatch('updateConversationList', {
        conversationId: key,
        chatType: params.chatType,
      });
    },
    //获取历史消息
    getHistoryMessage: async ({ state, dispatch, commit }, params) => {
      const { id, chatType, cursor } = params;
      return new Promise((resolve, reject) => {
        const options = {
          targetId: id,
          pageSize: 10,
          cursor: cursor,
          chatType: chatType,
          searchDirection: 'up',
        };
        EMClient.getHistoryMessages(options)
          .then((res) => {
            const { cursor, messages } = res;
            messages.length > 0 &&
              messages.forEach((item) => {
                item.read = true;
              });
            resolve({ messages, cursor });
            const reversedMessages = _.reverse(_.cloneDeep(messages));
            commit('UPDATE_HISTORY_MESSAGE', {
              listKey: id,
              historyMessageList: reversedMessages,
            });
            if (!state.messageList[id]) {
              //提示会话列表更新
              dispatch('updateConversationList', {
                conversationId: id,
                chatType: chatType,
              });
            }
            // console.log('>>>>>获取历史消息', reversedMessages);
            // debugger;
            dispatch('UsersProfile/processMessageExt', reversedMessages, {
              root: true,
            });
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    //已发送展示类型消息
    senedShowTypeMessage: async ({ dispatch, commit }, message) => {
      commit('UPDATE_MESSAGE_LIST', message);
      // 提示会话列表更新
      dispatch('updateConversationList', {
        conversationId: message.to,
        chatType: message.chatType,
      });
    },
    //添加通知类消息
    createInformMessage: ({ dispatch, commit }, params) => {
      /** 
               const params = {
                    from: '',
                    to: '',
                    chatType: '',
                    msg:''
                }
            */
      console.log('first', params);
      const msgBody = _.cloneDeep(params);
      msgBody.type = CUSTOM_MESSAGE_TYPE.INFORM;
      const key = setMessageKey(params);

      commit('UPDATE_MESSAGE_LIST', msgBody);
      dispatch('updateConversationList', {
        conversationId: key,
        chatType: msgBody.chatType,
      });
    },
    //删除消息
    removeMessage: ({ dispatch, commit }, params) => {
      const { id: mid, chatType } = params;
      const key = setMessageKey(params);
      return new Promise((resolve, reject) => {
        EMClient.removeHistoryMessages({
          targetId: key,
          chatType: chatType,
          messageIds: [mid],
        })
          .then((res) => {
            commit('CHANGE_MESSAGE_BODAY', {
              type: CHANGE_MESSAGE_BODAY_TYPE.DELETE,
              key: key,
              mid,
            });
            dispatch('updateConversationList', {
              conversationId: key,
              chatType,
            });
            resolve('OK');
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    //撤回消息
    recallMessage: async ({ dispatch, commit }, params) => {
      const { mid, to, chatType } = params;
      return new Promise((resolve, reject) => {
        EMClient.recallMessage({ mid, to, chatType })
          .then(() => {
            commit('CHANGE_MESSAGE_BODAY', {
              type: CHANGE_MESSAGE_BODAY_TYPE.RECALL,
              key: to,
              mid,
            });
            dispatch('updateConversationList', {
              conversationId: to,
              chatType,
            });
            resolve('OK');
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    //修改（编辑）消息
    modifyMessage: async ({ dispatch, commit }, params) => {
      const { id: mid, to, chatType, msg } = params;
      return new Promise((resolve, reject) => {
        const textMessage = EMClient.Message.create({
          type: 'txt',
          msg: msg,
          to: to,
          chatType: chatType,
        });

        EMClient.modifyMessage({
          messageId: mid,
          modifiedMessage: textMessage,
        })
          .then((res) => {
            const { message } = res || {};
            commit('CHANGE_MESSAGE_BODAY', {
              type: CHANGE_MESSAGE_BODAY_TYPE.MODIFY,
              key: to,
              mid,
              message,
            });
            dispatch('updateConversationList', {
              conversationId: to,
              chatType,
            });
            resolve(res);
          })
          .catch((e) => {
            reject(e);
          });
      });
    },
  },
  getters: {
    getMessageIdsCollectionMap: (state) => (messageIdsCollectionKey) => {
      return state.messageIdsCollection[messageIdsCollectionKey];
    },
  },
};
export default Message;
