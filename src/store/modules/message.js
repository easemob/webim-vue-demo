import { getCurrentUserId, requireManager } from '@/IM';
import { normalizeSdk5Messages } from '@/IM/sdk5/messageAdapter';
import { setMessageKey } from '@/utils/handleSomeData';
import _ from 'lodash';
import {
  MESSAGE_STATUS_TYPE,
  CUSTOM_MESSAGE_TYPE,
  CHANGE_MESSAGE_BODAY_TYPE,
  CHAT_TYPE,
  MAX_MESSAGE_LIST_COUNT,
} from '@/constant';
import { isDirectedMessage } from '@/utils/directedMessage';
import eventEmitter from '@/utils/eventEmitter';
import {
  STREAM_MIN_SDK_VERSION,
  isSdkVersionAtLeast,
  shouldTriggerIncomingMessageEffects,
} from '@/utils/streamMessageSupport';

const chatManager = () => requireManager('chatManager');
const chatThreadManager = () => requireManager('chatThreadManager');

const normalizeReactionList = (reactions = []) => {
  if (!Array.isArray(reactions)) return [];
  return reactions
    .filter((item) => item && item.reaction)
    .map((item) => ({
      reaction: item.reaction,
      count: Number(item.count ?? item.userCount) || 0,
      userList: Array.isArray(item.userList) ? item.userList : [],
      isAddedBySelf: !!item.isAddedBySelf,
      op: Array.isArray(item.op) ? item.op : [],
    }));
};

const updateMessageReactionByKey = (state, listKey, messageId, reactions) => {
  if (!state.messageList[listKey]) return false;
  const message = _.find(state.messageList[listKey], (o) => o.id === messageId);
  if (!message) return false;
  message.reactions = normalizeReactionList(reactions);
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
  return message.id === messageId || message.mid === messageId;
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
    id: message.id,
    mid: message.mid,
    to: message.to,
    from: message.from,
    chatType: message.chatType,
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

const getHistoryNextCursor = (res) =>
  res?.cursor ??
  res?.next_key ??
  res?.nextKey ??
  res?.nex_key ??
  res?.data?.cursor ??
  res?.data?.next_key ??
  res?.data?.nextKey ??
  res?.data?.nex_key;

const normalizeHistoryCursor = (cursor) => {
  if (cursor === undefined || cursor === null) return '';
  const normalized = String(cursor).trim();
  if (normalized === '') return '';
  if (normalized.toLowerCase() === 'undefined') return '';
  if (normalized.toLowerCase() === 'null') return '';
  return normalized;
};

const shouldPreserveEditedText = (currentMessage, incomingMessage) => {
  if (!currentMessage || !incomingMessage) return false;
  if (currentMessage.type !== 'txt') return false;
  if (incomingMessage.type !== undefined && incomingMessage.type !== 'txt')
    return false;
  const currentOperationCount =
    Number(currentMessage?.modifiedInfo?.operationCount) || 0;
  const incomingOperationCount =
    Number(incomingMessage?.modifiedInfo?.operationCount) || 0;
  if (currentOperationCount <= 0) return false;
  if (currentMessage.msg === undefined || incomingMessage.msg === undefined)
    return false;
  return (
    currentMessage.msg !== incomingMessage.msg &&
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
    nextMessage.msg = currentMessage.msg;
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
    UPDATE_MESSAGE_LIST: (state, msgBody) => {
      // 确保msgBody有基本属性
      if (!msgBody) {
        console.error('msgBody为空，无法更新消息列表');
        return;
      }

      const serverMsgId =
        msgBody.id || Date.now() + Math.random().toString(36).substring(2);
      const listKey = setMessageKey(msgBody);

      if (!state.messageList[listKey]) {
        state.messageList[listKey] = [];
      }

      // 为所有类型的消息生成临时ID（如果没有）
      if (!msgBody.id) {
        msgBody.id = serverMsgId;
      }

      // 先检查是否已存在相同ID的消息，仅在不存在时添加
      if (msgBody.id) {
        const exists = state.messageList[listKey].some(
          (m) => m.id === msgBody.id,
        );
        if (!exists) {
          state.messageList[listKey].push(msgBody);
        } else {
          // 如果存在相同ID的消息，更新它而不是忽略
          const index = state.messageList[listKey].findIndex(
            (m) => m.id === msgBody.id,
          );
          if (index !== -1) {
            const currentMessage = state.messageList[listKey][index];
            state.messageList[listKey][index] =
              mergeMessagePreservingEditedText(currentMessage, msgBody);
          }
        }
      } else {
        // 如果没有ID，直接添加
        state.messageList[listKey].push(msgBody);
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
        msgBody.chatType === CHAT_TYPE.SINGLE
      ) {
        state.messageIdsCollection[listKey] = new Map();
      }
      if (
        msgBody.from === getCurrentUserId() &&
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
      const currentMessages = state.messageList[listKey] || [];
      const mergedById = new Map();

      currentMessages.forEach((message) => {
        if (message?.id) {
          mergedById.set(message.id, message);
        }
      });

      historyMessageList.forEach((message) => {
        if (!message?.id) {
          return;
        }
        const currentMessage = mergedById.get(message.id);
        mergedById.set(
          message.id,
          mergeMessagePreservingEditedText(currentMessage, message),
        );
      });

      const historyIds = new Set(
        historyMessageList.map((message) => message?.id).filter(Boolean),
      );
      const mergedHistory = historyMessageList.map(
        (message) => mergedById.get(message.id) || message,
      );
      const remainedCurrent = currentMessages.filter(
        (message) => !message?.id || !historyIds.has(message.id),
      );

      state.messageList[listKey] = [...mergedHistory, ...remainedCurrent];
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
              if (res) {
                res.isRecall = true;
              } else {
                console.warn('未找到要撤回的消息:', mid);
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
                (o) => o.id === mid,
              );
              sourceData.splice(index, 1);
              state.messageList[key] = _.assign([], sourceData);
            }
          }
          break;
        case CHANGE_MESSAGE_BODAY_TYPE.MODIFY:
          {
            const res = findMessageById(state, key, mid);
            if (res) {
              // 保存原始的发送者信息和聊天类型
              const originalMessage = { ...res };
              const originalFrom = res.from;
              const originalChatType = res.chatType;
              const originalMsg = res.msg;
              // 更新消息内容，但保持发送者和聊天类型不变
              _.assign(res, payload?.message);
              if (payload?.msg !== undefined) {
                res.msg = payload.msg;
              } else if (
                shouldPreserveEditedText(originalMessage, payload?.message)
              ) {
                res.msg = originalMsg;
              }
              // 恢复原始的发送者信息和聊天类型
              res.from = originalFrom;
              res.chatType = originalChatType;
            } else {
              console.warn('未找到要修改的消息:', mid);
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
      const { messageId, conversationId, chatType } = payload;
      const key = setMessageKey({ to: conversationId, chatType });
      if (state.messageList[key]) {
        const message = _.find(
          state.messageList[key],
          (o) => o.id === messageId,
        );
        if (message) {
          message.delivered = true;
        } else {
          console.warn('[Message Receipt] 未找到送达回执对应消息', {
            messageId,
            conversationId,
            chatType,
            listKey: key,
          });
        }
      } else {
        console.warn('[Message Receipt] 送达回执对应消息列表不存在', {
          messageId,
          conversationId,
          chatType,
          listKey: key,
        });
      }
    },
    // 更新消息已读状态
    UPDATE_MESSAGE_READ: (state, payload) => {
      const { messageId, conversationId, chatType, groupReadCount } = payload;
      const key = setMessageKey({ to: conversationId, chatType });
      if (state.messageList[key]) {
        const message = _.find(
          state.messageList[key],
          (o) => o.id === messageId,
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
            chatType,
            groupReadCount,
            listKey: key,
          });
        }
      } else {
        console.warn('[Message Receipt] 已读回执对应消息列表不存在', {
          messageId,
          conversationId,
          chatType,
          groupReadCount,
          listKey: key,
        });
      }
    },
    // 发送消息已读回执
    SEND_MESSAGE_READ_RECEIPT: (state, payload) => {
      const { messageId, to, chatType } = payload;
      const key = setMessageKey({ to, chatType });
      if (state.messageList[key]) {
        const message = _.find(
          state.messageList[key],
          (o) => o.id === messageId,
        );
        if (message) {
          if (chatType === CHAT_TYPE.SINGLE || chatType === CHAT_TYPE.GROUP) {
            chatManager()
              .sendMessageReadReceipts({
                conversationId: to,
                conversationType: chatType,
                messageIds: [messageId],
              })
              .then((result) => {
                console.log('[Message Receipt] send read receipt success', {
                  messageId,
                  targetId: to,
                  chatType,
                  listKey: key,
                  result,
                });
              })
              .catch((error) => {
                console.error('[Message Receipt] send read receipt failed', {
                  messageId,
                  targetId: to,
                  chatType,
                  listKey: key,
                  error,
                });
              });
          } else {
            console.error('[Message Receipt] SDK 5.0 does not support chatroom receipts', {
              messageId,
              targetId: to,
              chatType,
              listKey: key,
            });
          }
        } else {
          console.warn('[Message Receipt] 未找到需要发送已读回执的消息', {
            messageId,
            targetId: to,
            chatType,
            listKey: key,
          });
        }
      } else {
        console.warn('[Message Receipt] 已读回执对应消息列表不存在', {
          messageId,
          targetId: to,
          chatType,
          listKey: key,
        });
      }
    },
  },
  actions: {
    //添加新消息
    createNewMessage: ({ dispatch, commit, state }, params) => {
      const key = setMessageKey(params);
      const existedBefore = hasMessageInList(state, key, params?.id);
      const shouldTriggerSideEffects = shouldTriggerIncomingMessageEffects({
        message: params,
        existedBefore,
      });

      commit('UPDATE_MESSAGE_LIST', params);
      // 流式消息后续分片只更新原消息内容，不重复触发新消息副作用
      if (shouldTriggerSideEffects) {
        eventEmitter.emit('newMessage', params);
      }

      if (!isDirectedMessage(params)) {
        dispatch('updateConversationList', {
          conversationId: key,
          chatType: params.chatType,
          incrementUnread: shouldTriggerSideEffects,
        });
      }
    },
    //获取历史消息
    getHistoryMessage: async ({ state, dispatch, commit }, params) => {
      const {
        id,
        chatType,
        cursor = -1,
        pageSize = 20,
        searchDirection = 'up',
        searchOptions,
      } = params;
      return new Promise((resolve, reject) => {
        if (
          chatType === CHAT_TYPE.CHATROOM &&
          !isSdkVersionAtLeast(
          '5.0.0',
            STREAM_MIN_SDK_VERSION,
          )
        ) {
          const error = new Error(
            `聊天室历史消息需要 Web SDK >= ${STREAM_MIN_SDK_VERSION}，当前版本 5.0.0`,
          );
          console.error('[History Message] chatroom history unsupported', {
            conversationId: id,
            chatType,
            sdkVersion: '5.0.0',
            minimumVersion: STREAM_MIN_SDK_VERSION,
            error,
          });
          reject(error);
          return;
        }

        const options = {
          targetId: id,
          pageSize: Math.min(Math.max(Number(pageSize) || 20, 1), 50),
          cursor,
          chatType: chatType,
          isChatThread: params.isChatThread === true,
          searchDirection,
          ...(searchOptions ? { searchOptions } : {}),
        };
        chatManager().getHistoryMessages({
          conversationId: id,
          conversationType: chatType,
          cursor: cursor === -1 ? '' : String(cursor),
          pageSize: Math.min(Math.max(Number(pageSize) || 20, 1), 50),
          searchDirection,
        })
          .then((res) => {
            const nextCursor = normalizeHistoryCursor(getHistoryNextCursor(res));
            const messages = normalizeSdk5Messages(res.items || []);
            const messageCount = messages?.length || 0;
            const reactionMessages = (messages || []).filter(
              (item) =>
                Array.isArray(item?.reactions) && item.reactions.length > 0,
            );
            if (reactionMessages.length > 0) {
              console.log(
                '[Reaction] getHistoryMessages 返回的消息包含 Reaction 概览',
                reactionMessages.map((item) => ({
                  messageId: item.id,
                  chatType: item.chatType,
                  reactions: item.reactions,
                })),
              );
            }
            const historyMessagesMissingFields = (messages || []).filter(
              (item) => !item?.chatType || !item?.to,
            );
            if (historyMessagesMissingFields.length > 0) {
              console.error(
                '[History Message] 服务端返回的历史消息缺少关键字段，按原始结果展示/入库',
                {
                  conversationId: id,
                  requestChatType: chatType,
                  missingCount: historyMessagesMissingFields.length,
                  messages: historyMessagesMissingFields,
                },
              );
            }
            resolve({
              messages,
              cursor: nextCursor,
              hasMore: String(nextCursor) !== '',
            });
            const reversedMessages = _.reverse(_.cloneDeep(messages || []));
            // 为历史消息生成正确的listKey
            const listKey = setMessageKey({ to: id, chatType });
            commit('UPDATE_HISTORY_MESSAGE', {
              listKey: listKey,
              historyMessageList: reversedMessages,
            });
            if (!state.messageList[listKey]) {
              //提示会话列表更新
              dispatch('updateConversationList', {
                conversationId: id,
                chatType: chatType,
              });
            }
            dispatch('UsersProfile/processMessageExt', reversedMessages, {
              root: true,
            });
            console.log('[History Message] getHistoryMessages success', {
              conversationId: id,
              chatType,
              cursor,
              nextCursor,
              pageSize: options.pageSize,
              searchDirection,
              searchOptions,
              messageCount,
              firstMessageId: messageCount > 0 ? messages[0].id : '',
              lastMessageId:
                messageCount > 0 ? messages[messageCount - 1].id : '',
              listKey,
            });
          })
          .catch((error) => {
            console.error('[History Message] getHistoryMessages failed', {
              conversationId: id,
              chatType,
              cursor,
              pageSize: options.pageSize,
              searchDirection,
              searchOptions,
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
                conversationId: id,
                chatType,
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
          conversationId: setMessageKey(message), // 使用setMessageKey生成正确的列表键
          chatType: message.chatType,
        });
      }
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
      const { id: mid, to, chatType } = params;

      // 验证参数
      if (!to || to === '') {
        return Promise.reject(new Error('缺少targetId参数'));
      }

      const key = setMessageKey(params);
      const deleteOptions = {
        targetId: to,
        chatType: chatType,
        messageIds: [mid],
      };
      console.log('[Message Delete] removeHistoryMessages 请求参数', {
        event: '聊天室/会话消息删除',
        messageId: mid,
        targetId: deleteOptions.targetId,
        conversationKey: key,
        chatType,
        to,
        from: params?.from,
        sdkOptions: deleteOptions,
        rawMessage: params,
      });
      return new Promise((resolve, reject) => {
        chatManager().removeHistoryMessages({
          conversationId: to,
          conversationType: chatType,
          messageIds: [mid],
        })
          .then((res) => {
            console.log('[Message Delete] removeHistoryMessages 成功', {
              messageId: mid,
              targetId: deleteOptions.targetId,
              conversationKey: key,
              chatType,
              response: res,
            });
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
            console.error('[Message Delete] removeHistoryMessages 失败', {
              messageId: mid,
              targetId: deleteOptions.targetId,
              conversationKey: key,
              chatType,
              to,
              from: params?.from,
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
      const { mid, to, chatType } = params;
      const isChatThread = params.isChatThread === true;

      return new Promise((resolve, reject) => {
        chatManager().recallMessage({
          conversationId: to,
          conversationType: chatType,
          messageId: mid,
        })
          .then((result) => {
            const key = setMessageKey({ to, chatType });
            commit('CHANGE_MESSAGE_BODAY', {
              type: CHANGE_MESSAGE_BODAY_TYPE.RECALL,
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
        !params.id ||
        !params.to ||
        !params.chatType ||
        !params.msg
      ) {
        console.error('modifyMessage 参数错误:', params);
        return Promise.reject(new Error('参数错误'));
      }

      const { id, mid, to, chatType, msg } = params;
      const messageId = mid || id;
      const key = setMessageKey(params);
      const isChatThread = params.isChatThread === true;
      if (!messageId) {
        console.error('modifyMessage 缺少可用的消息 ID:', params);
        return Promise.reject(new Error('缺少消息ID'));
      }
      return new Promise((resolve, reject) => {
        const textMessage = chatManager().createTextMessage({
          conversationId: to,
          conversationType: chatType,
          content: msg,
        });

        chatManager().modifyMessage({
          conversationId: to,
          conversationType: chatType,
          messageId,
          message: textMessage,
        })
          .then((res) => {
            const { message } = res || {};
            commit('CHANGE_MESSAGE_BODAY', {
              type: CHANGE_MESSAGE_BODAY_TYPE.MODIFY,
              key: key,
              mid: messageId,
              msg,
              message: {
                ...(message || {}),
                id: message?.id || id || messageId,
                mid: message?.mid || mid || messageId,
                to: message?.to || to,
                chatType: message?.chatType || chatType,
                msg,
              },
            });
            dispatch('updateConversationList', {
              conversationId: key,
              chatType,
            });
            resolve('OK');
          })
          .catch((error) => {
            console.error('[Message Modify] modifyMessage 失败', {
              error,
              messageId,
              targetId: to,
              chatType,
              conversationKey: key,
              modifiedContent: msg,
              isChatThread,
              groupId: params.groupId,
              loginUser: getCurrentUserId(),
            });
            reject(error);
          });
      });
    },
    fetchMessageReactionList: async ({ commit }, params) => {
      const { messageId, chatType, groupId, key } = params || {};
      if (!messageId || !chatType) {
        throw new Error('fetchMessageReactionList 缺少参数');
      }
      try {
        const res = await chatManager().getReactionList({
          messageId,
          conversationType: chatType,
          conversationId: groupId || params?.conversationId,
        });
        const rawList = Array.isArray(res) ? res : [];
        const target =
          rawList.find(
            (item) => item?.msgId === messageId || item?.messageId === messageId,
          ) || {};
        const reactions = normalizeReactionList(
          target?.reactionList || target?.reactions || [],
        );
        console.log('[Reaction] getReactionlist success', {
          messageId,
          chatType,
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
          chatType,
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
          userCount: Array.isArray(res?.data) ? res.data.length : undefined,
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
      const { messageId, reaction, chatType, groupId, key } = params || {};
      if (!messageId || !reaction) {
        throw new Error('addMessageReaction 缺少参数');
      }
      if (chatType === CHAT_TYPE.CHATROOM) {
        throw new Error('聊天室暂不支持 Reaction');
      }
      try {
        await chatManager().addReaction({ messageId, reaction });
        console.log('[Reaction] addReaction success', {
          messageId,
          reaction,
          chatType,
          groupId,
        });
      } catch (error) {
        throw error;
      }
      return dispatch('fetchMessageReactionList', {
        messageId,
        chatType,
        groupId,
        key,
      });
    },
    deleteMessageReaction: async ({ dispatch }, params) => {
      const { messageId, reaction, chatType, groupId, key } = params || {};
      if (!messageId || !reaction) {
        throw new Error('deleteMessageReaction 缺少参数');
      }
      if (chatType === CHAT_TYPE.CHATROOM) {
        throw new Error('聊天室暂不支持 Reaction');
      }
      await chatManager().removeReaction({ messageId, reaction });
      console.log('[Reaction] deleteReaction success', {
        messageId,
        reaction,
        chatType,
        groupId,
      });
      return dispatch('fetchMessageReactionList', {
        messageId,
        chatType,
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
