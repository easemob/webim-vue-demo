import { getCurrentUserId, requireManager } from '@/IM';
import _ from 'lodash';
import {
  MESSAGE_STATUS_TYPE,
  CHANGE_MESSAGE_BODAY_TYPE,
  CHAT_TYPE,
  MAX_MESSAGE_LIST_COUNT,
} from '@/constant';
import { isDirectedMessage } from '@/utils/directedMessage';
import eventEmitter from '@/utils/eventEmitter';
import { shouldTriggerIncomingMessageEffects } from '@/utils/streamMessageSupport';

const chatManager = () => requireManager('chatManager');
const chatThreadManager = () => requireManager('chatThreadManager');
const messageIdOf = (message) => message?.msgServerId || message?.msgLocalId || '';

const updateMessageReactionByKey = (state, listKey, messageId, reactions) => {
  if (!state.messageList[listKey]) return false;
  const message = _.find(
    state.messageList[listKey],
    (item) => messageIdOf(item) === messageId,
  );
  if (!message) return false;
  message.reactions = reactions;
  return true;
};

const updateMessageReactionInAllLists = (state, messageId, reactions) => {
  let found = false;
  Object.keys(state.messageList).forEach((listKey) => {
    const updated = updateMessageReactionByKey(
      state,
      listKey,
      messageId,
      reactions,
    );
    if (updated) found = true;
  });
  return found;
};

const isSameMessage = (message, messageId) => {
  if (!message || !messageId) return false;
  return messageIdOf(message) === messageId;
};

const findMessageById = (state, preferredKey, messageId) => {
  if (!messageId) return null;

  if (preferredKey && state.messageList[preferredKey]) {
    const preferredMessage = _.find(state.messageList[preferredKey], (item) =>
      isSameMessage(item, messageId),
    );
    if (preferredMessage) {
      return preferredMessage;
    }
  }

  const fallbackKey = Object.keys(state.messageList).find((listKey) => {
    if (listKey === preferredKey) return false;
    return state.messageList[listKey]?.some((item) =>
      isSameMessage(item, messageId),
    );
  });

  if (!fallbackKey) return null;

  return _.find(state.messageList[fallbackKey], (item) =>
    isSameMessage(item, messageId),
  );
};

const hasMessageInList = (state, listKey, messageId) => {
  if (!listKey || !messageId) return false;
  return !!state.messageList[listKey]?.some((item) =>
    isSameMessage(item, messageId),
  );
};

const findLocalMessageMetaById = (state, messageId) => {
  const message = findMessageById(state, '', messageId);
  if (!message) return null;
  return {
    messageId: messageIdOf(message),
    conversationId: message.conversationId,
    conversationType: message.conversationType,
    isChatThread: message.isChatThread,
    groupId: message.groupId,
  };
};

const describeThreadError = (error) => {
  if (!error) return null;
  return {
    message: error.message || '',
    type: error.type || '',
    code: error.code || error.status || '',
    name: error.name || '',
  };
};

const logThreadApiSuccess = (methodName, params, response) => {
  console.log(`[Thread] ${methodName} success`, {
    params,
    response,
  });
};

const logThreadApiFailure = (methodName, params, error) => {
  console.error(`[Thread] ${methodName} failed`, {
    params,
    errorSummary: describeThreadError(error),
    error,
  });
};

const callThreadApi = async (methodName, params, request) => {
  try {
    const res = await request();
    logThreadApiSuccess(methodName, params, res);
    return res;
  } catch (error) {
    logThreadApiFailure(methodName, params, error);
    throw error;
  }
};

const shouldPreserveEditedText = (currentMessage, incomingMessage) => {
  if (!currentMessage || !incomingMessage) return false;
  if (currentMessage.type !== 'text') return false;
  if (incomingMessage.type !== undefined && incomingMessage.type !== 'text')
    return false;
  const currentOperationCount =
    Number(currentMessage?.modifiedInfo?.operationCount) || 0;
  const incomingOperationCount =
    Number(incomingMessage?.modifiedInfo?.operationCount) || 0;
  if (currentOperationCount <= 0) return false;
  if (
    currentMessage.body?.content === undefined ||
    incomingMessage.body?.content === undefined
  )
    return false;
  return (
    currentMessage.body.content !== incomingMessage.body.content &&
    incomingOperationCount <= currentOperationCount
  );
};

const mergeMessagePreservingEditedText = (currentMessage, incomingMessage) => {
  if (!currentMessage) return incomingMessage;
  if (!incomingMessage) return currentMessage;
  const shouldKeepEditedText = shouldPreserveEditedText(
    currentMessage,
    incomingMessage,
  );
  const nextMessage = {
    ...currentMessage,
    ...incomingMessage,
  };
  if (shouldKeepEditedText) {
    nextMessage.body = { ...nextMessage.body, content: currentMessage.body.content };
  }
  return nextMessage;
};

const Message = {
  state: {
    messageList: {},
    messageIdsCollection: {
      // 'pfh':new Map(),
      // 'pfh1':new Map(),
    },
  },
  mutations: {
    UPDATE_MESSAGE_LIST: (state, message) => {
      // 确保msgBody有基本属性
      if (!message?.conversationId || !message?.conversationType) {
        console.error('SDK 5.0 message is incomplete; cannot update message list', message);
        return;
      }
      const messageId = messageIdOf(message);
      if (!messageId) {
        console.error('SDK 5.0 message has no msgServerId or msgLocalId', message);
        return;
      }
      const listKey = message.conversationId;

      if (!state.messageList[listKey]) {
        state.messageList[listKey] = [];
      }

      {
        const exists = state.messageList[listKey].some(
          (item) => messageIdOf(item) === messageId,
        );
        if (!exists) {
          state.messageList[listKey].push(message);
        } else {
          const index = state.messageList[listKey].findIndex(
            (item) => messageIdOf(item) === messageId,
          );
          if (index !== -1) {
            const currentMessage = state.messageList[listKey][index];
            state.messageList[listKey][index] =
              mergeMessagePreservingEditedText(currentMessage, message);
          }
        }
      }

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
        message.conversationType === CHAT_TYPE.SINGLE
      ) {
        state.messageIdsCollection[listKey] = new Map();
      }
      if (
        message.sender?.userId === getCurrentUserId() &&
        message.conversationType === CHAT_TYPE.SINGLE
      ) {
        state.messageIdsCollection[listKey].set(messageId, {
          [MESSAGE_STATUS_TYPE.READ_STATUS]: false,
        });
      }
    },
    UPDATE_HISTORY_MESSAGE: (state, payload) => {
      const { listKey, historyMessageList } = payload;
      if (!state.messageList[listKey]) {
        state.messageList[listKey] = [];
      }
      const currentMessages = state.messageList[listKey] || [];
      const mergedById = new Map();

      currentMessages.forEach((message) => {
        if (messageIdOf(message)) {
          mergedById.set(messageIdOf(message), message);
        }
      });

      historyMessageList.forEach((message) => {
        if (!messageIdOf(message)) {
          return;
        }
        const messageId = messageIdOf(message);
        const currentMessage = mergedById.get(messageId);
        mergedById.set(
          messageId,
          mergeMessagePreservingEditedText(currentMessage, message),
        );
      });

      const historyIds = new Set(
        historyMessageList.map(messageIdOf).filter(Boolean),
      );
      const mergedHistory = historyMessageList.map(
        (message) => mergedById.get(messageIdOf(message)) || message,
      );
      const remainedCurrent = currentMessages.filter(
        (message) => !messageIdOf(message) || !historyIds.has(messageIdOf(message)),
      );

      state.messageList[listKey] = [...mergedHistory, ...remainedCurrent];
    },
    UPDATE_MESSAGE_IDS_COLLECTION: (state, payload) => {
      const { messageId, key, type } = payload;
      switch (type) {
        case MESSAGE_STATUS_TYPE.READ_STATUS:
          {
            if (state.messageIdsCollection[key]) {
              state.messageIdsCollection[key].set(messageId, {
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
      const { type, key, messageId } = payload;
      switch (type) {
        case CHANGE_MESSAGE_BODAY_TYPE.RECALL:
          {
            if (state.messageList[key]) {
              const res = _.find(
                state.messageList[key],
                (item) => messageIdOf(item) === messageId,
              );
              if (res) {
                res.isRecall = true;
              } else {
                console.warn('未找到要撤回的消息:', messageId);
              }
            }
          }

          break;
        case CHANGE_MESSAGE_BODAY_TYPE.DELETE:
          {
            if (state.messageList[key]) {
              const sourceData = state.messageList[key];
              const index = _.findIndex(
                state.messageList[key],
                (item) => messageIdOf(item) === messageId,
              );
              sourceData.splice(index, 1);
              state.messageList[key] = _.assign([], sourceData);
            }
          }
          break;
        case CHANGE_MESSAGE_BODAY_TYPE.MODIFY:
          {
            const res = findMessageById(state, key, messageId);
            if (res) {
              res.body = payload?.message?.body;
              res.ext = payload?.message?.ext;
              res.modifiedInfo = payload?.message?.modifiedInfo;
              const updatedContent = payload?.message?.body?.content;
              if (updatedContent !== undefined) {
                res.body = { ...res.body, content: updatedContent };
              }
            } else {
              console.warn('未找到要修改的消息:', messageId);
            }
          }
          break;
        default:
          break;
      }
    },
    UPDATE_MESSAGE_REACTIONS: (state, payload) => {
      const { messageId, reactions, key } = payload;
      if (!messageId) return;
      if (key) {
        const updated = updateMessageReactionByKey(
          state,
          key,
          messageId,
          reactions,
        );
        if (updated) return;
      }
      updateMessageReactionInAllLists(state, messageId, reactions);
    },
    // 更新消息送达状态
    UPDATE_MESSAGE_DELIVERED: (state, payload) => {
      const { messageId, conversationId, conversationType } = payload;
      const key = conversationId;
      if (state.messageList[key]) {
        const message = _.find(
          state.messageList[key],
          (item) => messageIdOf(item) === messageId,
        );
        if (message) {
          message.delivered = true;
        } else {
          console.warn('[Message Receipt] 未找到送达回执对应消息', {
            messageId,
            conversationId,
            conversationType,
            listKey: key,
          });
        }
      } else {
        console.warn('[Message Receipt] 送达回执对应消息列表不存在', {
          messageId,
          conversationId,
          conversationType,
          listKey: key,
        });
      }
    },
    // 更新消息已读状态
    UPDATE_MESSAGE_READ: (state, payload) => {
      const { messageId, conversationId, conversationType, groupReadCount } = payload;
      const key = conversationId;
      if (state.messageList[key]) {
        const message = _.find(
          state.messageList[key],
          (item) => messageIdOf(item) === messageId,
        );
        if (message) {
          message.read = true;
          if (groupReadCount !== undefined && groupReadCount !== null) {
            message.groupReadCount = groupReadCount;
          }
        } else {
          console.warn('[Message Receipt] 未找到已读回执对应消息', {
            messageId,
            conversationId,
            conversationType,
            groupReadCount,
            listKey: key,
          });
        }
      } else {
        console.warn('[Message Receipt] 已读回执对应消息列表不存在', {
          messageId,
          conversationId,
          conversationType,
          groupReadCount,
          listKey: key,
        });
      }
    },
    // 发送消息已读回执
    SEND_MESSAGE_READ_RECEIPT: (state, payload) => {
      const { messageId, conversationId, conversationType } = payload;
      const key = conversationId;
      if (state.messageList[key]) {
        const message = _.find(
          state.messageList[key],
          (item) => messageIdOf(item) === messageId,
        );
        if (message) {
          if (
            conversationType === CHAT_TYPE.SINGLE ||
            conversationType === CHAT_TYPE.GROUP
          ) {
            chatManager()
              .sendMessageReadReceipts({
                conversationId,
                conversationType,
                messageIds: [messageId],
              })
              .then((result) => {
                console.log('[Message Receipt] send read receipt success', {
                  messageId,
                  conversationId,
                  conversationType,
                  listKey: key,
                  result,
                });
              })
              .catch((error) => {
                console.error('[Message Receipt] send read receipt failed', {
                  messageId,
                  conversationId,
                  conversationType,
                  listKey: key,
                  error,
                });
              });
          } else {
            console.error('[Message Receipt] SDK 5.0 does not support chatroom receipts', {
              messageId,
              conversationId,
              conversationType,
              listKey: key,
            });
          }
        } else {
          console.warn('[Message Receipt] 未找到需要发送已读回执的消息', {
            messageId,
            conversationId,
            conversationType,
            listKey: key,
          });
        }
      } else {
        console.warn('[Message Receipt] 已读回执对应消息列表不存在', {
          messageId,
          conversationId,
          conversationType,
          listKey: key,
        });
      }
    },
  },
  actions: {
    //添加新消息
    createNewMessage: ({ dispatch, commit, state }, message) => {
      const key = message.conversationId;
      const existedBefore = hasMessageInList(state, key, messageIdOf(message));
      const shouldTriggerSideEffects = shouldTriggerIncomingMessageEffects({
        message,
        existedBefore,
      });

      commit('UPDATE_MESSAGE_LIST', message);
      // 流式消息后续分片只更新原消息内容，不重复触发新消息副作用
      if (shouldTriggerSideEffects) {
        eventEmitter.emit('newMessage', message);
      }

      if (!isDirectedMessage(message)) {
        dispatch('updateConversationList', {
          conversationId: key,
          conversationType: message.conversationType,
          incrementUnread: shouldTriggerSideEffects,
        });
      }
    },
    //获取历史消息
    getHistoryMessage: async ({ state, dispatch, commit }, params) => {
      const {
        conversationId,
        conversationType,
        cursor = -1,
        pageSize = 20,
        searchDirection = 'up',
      } = params;
      return new Promise((resolve, reject) => {
        const options = {
          conversationId,
          conversationType,
          pageSize: Math.min(Math.max(Number(pageSize) || 20, 1), 50),
          cursor: cursor === -1 ? '' : String(cursor),
          searchDirection,
        };
        chatManager().getHistoryMessages(options)
          .then((res) => {
            const { items: messages, cursor: nextCursor, hasMore } = res;
            const messageCount = messages.length;
            const reactionMessages = messages.filter(
              (item) =>
                Array.isArray(item?.reactions) && item.reactions.length > 0,
            );
            if (reactionMessages.length > 0) {
              console.log(
                '[Reaction] getHistoryMessages 返回的消息包含 Reaction 概览',
                reactionMessages.map((item) => ({
                  messageId: messageIdOf(item),
                  conversationId: item.conversationId,
                  conversationType: item.conversationType,
                  reactions: item.reactions,
                })),
              );
            }
            const historyMessagesMissingFields = messages.filter(
              (item) =>
                !item?.conversationId ||
                !item?.conversationType ||
                !messageIdOf(item),
            );
            if (historyMessagesMissingFields.length > 0) {
              console.error(
                '[History Message] 服务端返回的历史消息缺少关键字段，按原始结果展示/入库',
                {
                  conversationId,
                  conversationType,
                  missingCount: historyMessagesMissingFields.length,
                  messages: historyMessagesMissingFields,
                },
              );
            }
            resolve({
              messages,
              cursor: nextCursor,
              hasMore,
            });
            const reversedMessages = [...messages].reverse();
            const listKey = conversationId;
            const hasLocalConversation = !!state.messageList[listKey];
            commit('UPDATE_HISTORY_MESSAGE', {
              listKey,
              historyMessageList: reversedMessages,
            });
            if (!hasLocalConversation) {
              //提示会话列表更新
              dispatch('updateConversationList', {
                conversationId,
                conversationType,
              });
            }
            dispatch('UsersProfile/processMessageExt', reversedMessages, {
              root: true,
            });
            console.log('[History Message] getHistoryMessages success', {
              conversationId,
              conversationType,
              cursor,
              nextCursor,
              pageSize: options.pageSize,
              searchDirection,
              messageCount,
              firstMessageId: messageCount > 0 ? messageIdOf(messages[0]) : '',
              lastMessageId:
                messageCount > 0 ? messageIdOf(messages[messageCount - 1]) : '',
              listKey,
            });
          })
          .catch((error) => {
            console.error('[History Message] getHistoryMessages failed', {
              conversationId,
              conversationType,
              cursor,
              pageSize: options.pageSize,
              searchDirection,
              error,
              errorType: error.type,
              errorMessage: error.message,
              errorStack: error.stack,
            });

            // 处理INVALID_TOKEN错误
            if (
              error.type === 28 || // 错误类型28对应INVALID_TOKEN
              error.message?.includes('INVALID_TOKEN') ||
              error.message?.includes('Invalid token')
            ) {
              console.error('[History Message] 令牌无效，跳转到登录页面', {
                conversationId,
                conversationType,
                error,
              });
              // 清除本地存储的登录信息
              localStorage.removeItem('EASEIM_loginUser');
              // 跳转到登录页面
              window.location.href = '/login';
            }

            reject(error);
          });
      });
    },
    //已发送展示类型消息
    senedShowTypeMessage: async ({ dispatch, commit }, message) => {
      commit('UPDATE_MESSAGE_LIST', message);
      if (!isDirectedMessage(message)) {
        // 提示会话列表更新
        dispatch('updateConversationList', {
          conversationId: message.conversationId,
          conversationType: message.conversationType,
        });
      }
    },
    //删除消息
    removeMessage: ({ dispatch, commit }, params) => {
      const { messageId, conversationId, conversationType } = params;

      // 验证参数
      if (!conversationId) {
        return Promise.reject(new Error('缺少conversationId参数'));
      }

      const key = conversationId;
      const deleteOptions = {
        conversationId,
        conversationType,
        messageIds: [messageId],
      };
      console.log('[Message Delete] removeHistoryMessages 请求参数', {
        event: '聊天室/会话消息删除',
        messageId,
        conversationId,
        conversationKey: key,
        conversationType,
        sdkOptions: deleteOptions,
        rawMessage: params,
      });
      return new Promise((resolve, reject) => {
        chatManager().removeHistoryMessages({
          conversationId,
          conversationType,
          messageIds: [messageId],
        })
          .then((res) => {
            console.log('[Message Delete] removeHistoryMessages 成功', {
              messageId,
              conversationId,
              conversationKey: key,
              conversationType,
              response: res,
            });
            commit('CHANGE_MESSAGE_BODAY', {
              type: CHANGE_MESSAGE_BODAY_TYPE.DELETE,
              key: key,
              messageId,
            });
            dispatch('updateConversationList', {
              conversationId: key,
              conversationType,
            });
            resolve('OK');
          })
          .catch((error) => {
            console.error('[Message Delete] removeHistoryMessages 失败', {
              messageId,
              conversationId,
              conversationKey: key,
              conversationType,
              sdkOptions: deleteOptions,
              rawMessage: params,
              error,
            });
            reject(error);
          });
      });
    },
    //撤回消息
    recallMessage: async ({ dispatch, commit }, params) => {
      const { messageId, conversationId, conversationType } = params;
      const isChatThread = params.isChatThread === true;

      return new Promise((resolve, reject) => {
        chatManager().recallMessage({
          conversationId,
          conversationType,
          messageId,
        })
          .then((result) => {
            const key = conversationId;
            commit('CHANGE_MESSAGE_BODAY', {
              type: CHANGE_MESSAGE_BODAY_TYPE.RECALL,
              key: key,
              messageId,
            });

            dispatch('updateConversationList', {
              conversationId: key,
              conversationType,
            });

            resolve('OK');
          })
          .catch((error) => {
            // 打印真实的错误信息
            console.error('消息撤回失败:', error);
            reject(error);
          });
      });
    },
    //修改（编辑）消息
    modifyMessage: async ({ dispatch, commit }, params) => {
      if (
        !params ||
        !params.messageId ||
        !params.conversationId ||
        !params.conversationType ||
        !params.content
      ) {
        console.error('modifyMessage 参数错误:', params);
        return Promise.reject(new Error('参数错误'));
      }

      const { messageId, conversationId, conversationType, content } = params;
      const key = conversationId;
      const isChatThread = params.isChatThread === true;
      if (!messageId) {
        console.error('modifyMessage 缺少可用的消息 ID:', params);
        return Promise.reject(new Error('缺少消息ID'));
      }
      return new Promise((resolve, reject) => {
        const textMessage = chatManager().createTextMessage({
          conversationId,
          conversationType,
          content,
        });

        chatManager().modifyMessage({
          conversationId,
          conversationType,
          messageId,
          message: textMessage,
        })
          .then((message) => {
            commit('CHANGE_MESSAGE_BODAY', {
              type: CHANGE_MESSAGE_BODAY_TYPE.MODIFY,
              key: key,
              messageId,
              message,
            });
            dispatch('updateConversationList', {
              conversationId: key,
              conversationType,
            });
            resolve('OK');
          })
          .catch((error) => {
            console.error('[Message Modify] modifyMessage 失败', {
              error,
              messageId,
              conversationId,
              conversationType,
              conversationKey: key,
              modifiedContent: content,
              isChatThread,
              groupId: params.groupId,
              loginUser: getCurrentUserId(),
            });
            reject(error);
          });
      });
    },
    fetchMessageReactionList: async ({ commit }, params) => {
      const { messageId, conversationType, groupId, key } = params || {};
      if (!messageId || !conversationType) {
        throw new Error('fetchMessageReactionList 缺少参数');
      }
      try {
        const res = await chatManager().getReactionList({
          messageId,
          conversationType,
          groupId,
        });
        const target = res.find((item) => item.messageId === messageId);
        const reactions = target ? target.reactions : [];
        console.log('[Reaction] getReactionlist success', {
          messageId,
          conversationType,
          groupId,
          reactionCount: reactions.length,
          response: res,
        });
        commit('UPDATE_MESSAGE_REACTIONS', {
          key,
          messageId,
          reactions,
        });
        return reactions;
      } catch (error) {
        console.error('[Reaction] getReactionlist failed', {
          messageId,
          conversationType,
          groupId,
          error,
        });
        throw error;
      }
    },
    fetchMessageReactionDetail: async (_, params) => {
      const {
        messageId,
        reaction,
        cursor = null,
        pageSize = 20,
      } = params || {};
      if (!messageId || !reaction) return null;
      try {
        const res = await chatManager().getReactionDetail({
          messageId,
          reaction,
          cursor,
          pageSize,
        });
        console.log('[Reaction] getReactionDetail success', {
          messageId,
          reaction,
          cursor,
          pageSize,
          userCount: res.reactionUsers.length,
          response: res,
        });
        return res;
      } catch (error) {
        console.error('[Reaction] getReactionDetail failed', {
          messageId,
          reaction,
          cursor,
          pageSize,
          error,
        });
        throw error;
      }
    },
    handleReactionChange: ({ commit }, payload) => {
      if (!payload?.messageId) return;
      commit('UPDATE_MESSAGE_REACTIONS', {
        messageId: payload.messageId,
        reactions: payload.reactions || [],
      });
    },
    addMessageReaction: async ({ dispatch }, params) => {
      const { messageId, reaction, conversationType, groupId, key } = params || {};
      if (!messageId || !reaction) {
        throw new Error('addMessageReaction 缺少参数');
      }
      try {
        await chatManager().addReaction({ messageId, reaction });
        console.log('[Reaction] addReaction success', {
          messageId,
          reaction,
          conversationType,
          groupId,
        });
      } catch (error) {
        throw error;
      }
      return dispatch('fetchMessageReactionList', {
        messageId,
        conversationType,
        groupId,
        key,
      });
    },
    deleteMessageReaction: async ({ dispatch }, params) => {
      const { messageId, reaction, conversationType, groupId, key } = params || {};
      if (!messageId || !reaction) {
        throw new Error('deleteMessageReaction 缺少参数');
      }
      await chatManager().removeReaction({ messageId, reaction });
      console.log('[Reaction] deleteReaction success', {
        messageId,
        reaction,
        conversationType,
        groupId,
      });
      return dispatch('fetchMessageReactionList', {
        messageId,
        conversationType,
        groupId,
        key,
      });
    },
    createMessageThread: async (_, params) => {
      const { parentId, name, messageId } = params || {};
      if (!parentId || !name || !messageId) {
        throw new Error('createMessageThread 缺少参数');
      }
      try {
        const res = await chatThreadManager().createChatThread({
          parentId,
          name,
          messageId,
        });
        console.log('[Thread] createChatThread success', {
          parentId,
          name,
          messageId,
          response: res,
        });
        return res;
      } catch (error) {
        console.error('[Thread] createChatThread failed', {
          parentId,
          name,
          messageId,
          errorSummary: describeThreadError(error),
          error,
        });
        throw error;
      }
    },
    fetchMessageThreads: async (_, params) => {
      const { parentId, cursor = '', pageSize = 20 } = params || {};
      if (!parentId) {
        throw new Error('fetchMessageThreads 缺少 parentId');
      }
      try {
        const res = await chatThreadManager().getChatThreadList({
          parentId,
          cursor,
          pageSize,
        });
        console.log('[Thread] getChatThreads success', {
          parentId,
          cursor,
          pageSize,
          response: res,
        });
        return res;
      } catch (error) {
        console.error('[Thread] getChatThreads failed', {
          parentId,
          cursor,
          pageSize,
          errorSummary: describeThreadError(error),
          error,
        });
        throw error;
      }
    },
    fetchMessageThreadLastMessages: async (_, params) => {
      const { chatThreadIds } = params || {};
      if (!Array.isArray(chatThreadIds) || chatThreadIds.length === 0) {
        throw new Error('fetchMessageThreadLastMessages 缺少 chatThreadIds');
      }
      try {
        const res = await chatThreadManager().getChatThreadLastMessageList({
          chatThreadIds,
        });
        console.log('[Thread] getChatThreadLastMessage success', {
          chatThreadIds,
          response: res,
        });
        return res;
      } catch (error) {
        console.error('[Thread] getChatThreadLastMessage failed', {
          chatThreadIds,
          errorSummary: describeThreadError(error),
          error,
        });
        throw error;
      }
    },
    joinMessageThread: async (_, params) => {
      const { chatThreadId } = params || {};
      if (!chatThreadId) {
        throw new Error('joinMessageThread 缺少 chatThreadId');
      }
      return callThreadApi('joinChatThread', { chatThreadId }, () =>
        chatThreadManager().joinChatThread({ chatThreadId }),
      );
    },
    leaveMessageThread: async (_, params) => {
      const { chatThreadId } = params || {};
      if (!chatThreadId) {
        throw new Error('leaveMessageThread 缺少 chatThreadId');
      }
      return callThreadApi('leaveChatThread', { chatThreadId }, () =>
        chatThreadManager().leaveChatThread({ chatThreadId }),
      );
    },
    destroyMessageThread: async (_, params) => {
      const { chatThreadId } = params || {};
      if (!chatThreadId) {
        throw new Error('destroyMessageThread 缺少 chatThreadId');
      }
      return callThreadApi('destroyChatThread', { chatThreadId }, () =>
        chatThreadManager().destroyChatThread({ chatThreadId }),
      );
    },
    renameMessageThread: async (_, params) => {
      const { chatThreadId, name } = params || {};
      if (!chatThreadId || !name) {
        throw new Error('renameMessageThread 缺少参数');
      }
      return callThreadApi('changeChatThreadName', { chatThreadId, name }, () =>
        chatThreadManager().updateChatThreadName({ chatThreadId, name }),
      );
    },
    fetchMessageThreadDetail: async (_, params) => {
      const { chatThreadId } = params || {};
      if (!chatThreadId) {
        throw new Error('fetchMessageThreadDetail 缺少 chatThreadId');
      }
      return callThreadApi('getChatThreadDetail', { chatThreadId }, () =>
        chatThreadManager().getChatThreadInfo({ chatThreadId }),
      );
    },
    fetchMessageThreadMembers: async (_, params) => {
      const { chatThreadId, cursor = '', pageSize = 20 } = params || {};
      if (!chatThreadId) {
        throw new Error('fetchMessageThreadMembers 缺少 chatThreadId');
      }
      const options = {
        chatThreadId,
        cursor,
        pageSize,
      };
      return callThreadApi('getChatThreadMembers', options, () =>
        chatThreadManager().getChatThreadMemberList(options),
      );
    },
    removeMessageThreadMember: async (_, params) => {
      const { chatThreadId, username } = params || {};
      if (!chatThreadId || !username) {
        throw new Error('removeMessageThreadMember 缺少参数');
      }
      const options = {
        chatThreadId,
        username,
      };
      return callThreadApi('removeChatThreadMember', options, () =>
        chatThreadManager().removeChatThreadMember({
          chatThreadId,
          memberId: username,
        }),
      );
    },
    fetchJoinedMessageThreads: async (_, params = {}) => {
      const { parentId, cursor = '', pageSize = 20 } = params || {};
      const options = {
        ...(parentId ? { parentId } : {}),
        cursor,
        pageSize,
      };
      return callThreadApi('getJoinedChatThreads', options, () =>
        chatThreadManager().getJoinedChatThreadList(options),
      );
    },
  },
  getters: {
    getMessageIdsCollectionMap: (state) => state.messageIdsCollection,
    getMessageById: (state) => (messageId) =>
      findLocalMessageMetaById(state, messageId),
  },
};
export default Message;
