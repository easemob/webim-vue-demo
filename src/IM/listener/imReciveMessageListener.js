import { requireManager } from '../index';
import { normalizeSdk5Message } from '../sdk5/messageAdapter';
import { CHANGE_MESSAGE_BODAY_TYPE, CHAT_TYPE } from '@/constant';
import { setMessageKey } from '@/utils/handleSomeData';
import store from '@/store';
import { safeSync, wrapImEventHandler } from '@/utils/safeCall';
import {
  getThreadIdFromMessage,
  normalizeThreadMessage as normalizeThreadMessagePayload,
} from '@/utils/messageThread';

export const imReviceMessageListener = () => {
  const normalizeThreadMessage = (message) => {
    const normalizedMessage = normalizeThreadMessagePayload(message);
    if (normalizedMessage?.isChatThread && normalizedMessage?.chatThread) {
      normalizedMessage.to = normalizedMessage.chatThread.chatThreadId;
    } else {
      const chatThreadId = getThreadIdFromMessage(normalizedMessage);
      if (chatThreadId) {
        normalizedMessage.to = chatThreadId;
      }
    }
    return normalizedMessage;
  };
  //接收的消息往store中push
  const pushNewMessage = (message) => {
    if (Array.isArray(message)) {
      console.log('[IM Message] SDK 收到批量消息', {
        messageCount: message.length,
        firstMessageChatType: message[0]?.chatType,
        rawMessages: message,
      });
      message.forEach((messageItem, index) => {
        if (!messageItem || typeof messageItem !== 'object') {
          console.warn('[IM Message] 批量消息中存在空或非对象项，已忽略', {
            index,
            rawMessage: messageItem,
          });
          return;
        }
        pushNewMessage(messageItem);
      });
      return;
    }
    if (message == null || typeof message !== 'object') {
      console.warn('【IM】忽略空或非对象消息:', message);
      return;
    }
    const normalizedMessage = normalizeThreadMessage(normalizeSdk5Message(message));
    console.log('[IM Message] SDK 收到消息', {
      messageId: normalizedMessage.id || normalizedMessage.mid,
      type: normalizedMessage.type,
      chatType: normalizedMessage.chatType,
      from: normalizedMessage.from,
      to: normalizedMessage.to,
      isChatThread: normalizedMessage.isChatThread,
      chatThread: normalizedMessage.chatThread,
      rawMessage: message,
    });

    if (!normalizedMessage.chatType) {
      console.error('[IM Message] SDK 消息缺少 chatType，未写入本地消息列表', {
        messageId: normalizedMessage.id || normalizedMessage.mid,
        type: normalizedMessage.type,
        from: normalizedMessage.from,
        to: normalizedMessage.to,
        rawMessage: message,
      });
      return;
    }

    Promise.resolve(store.dispatch('createNewMessage', normalizedMessage)).catch(
      (err) => {
        console.error('[pushNewMessage.createNewMessage]', err);
      },
    );
    Promise.resolve(
      store.dispatch('UsersProfile/processMessageExt', normalizedMessage, {
        root: true,
      }),
    ).catch((err) => {
      console.error('[pushNewMessage.processMessageExt]', err);
    });
  };
  const pushStreamMessage = (message) => {
    if (message == null || typeof message !== 'object') {
      console.warn('【IM】忽略空流式消息事件:', message);
      return;
    }
    console.log('【Stream Message】收到流式消息分片:', {
      id: message.id,
      chatType: message.chatType,
      from: message.from,
      to: message.to,
      msg: message.msg,
      stream: message.stream,
    });
    pushNewMessage(message);
  };
  //收到他人的撤回指令
  const otherRecallMessage = (message) => {
    if (message == null || typeof message !== 'object') {
      console.warn('【IM】忽略空撤回事件:', message);
      return;
    }
    const { mid, id, chatType } = message;
    const messageId = mid || id;
    if (!messageId) {
      console.warn('【IM】撤回事件缺少消息 ID，已忽略:', message);
      return;
    }
    const localMessage = store.getters.getMessageById?.(messageId);
    if (!chatType && localMessage?.chatType === CHAT_TYPE.CHATROOM) {
      console.error(
        '[IM Recall] SDK 撤回事件缺少 chatType，聊天室消息未更新本地撤回状态',
        {
          messageId,
          from: message.from,
          to: message.to,
          localMessage,
          rawMessage: message,
        },
      );
      return;
    }
    const resolvedChatType = chatType || localMessage?.chatType;
    const resolvedMessage = {
      ...message,
      to: message.to || localMessage?.to,
      chatType: resolvedChatType,
    };
    if (!resolvedChatType) {
      console.error(
        '[IM Recall] SDK 撤回事件缺少 chatType，未更新本地消息或会话',
        {
          messageId,
          from: message.from,
          to: message.to,
          rawMessage: message,
        },
      );
      return;
    }
    if (!chatType) {
      console.log(
        '[IM Recall] SDK 撤回事件缺少 chatType，使用本地原消息真实 chatType 更新',
        {
          messageId,
          from: message.from,
          to: message.to,
          resolvedChatType,
          localMessage,
          rawMessage: message,
        },
      );
    }
    const key = setMessageKey(resolvedMessage);
    safeSync('otherRecallMessage.commit', () => {
      store.commit('CHANGE_MESSAGE_BODAY', {
        type: CHANGE_MESSAGE_BODAY_TYPE.RECALL,
        key,
        mid: messageId,
      });
    });
    Promise.resolve(
      store.dispatch('updateConversationList', {
        conversationId: key,
        chatType: resolvedChatType,
      }),
    ).catch((err) =>
      console.error('[otherRecallMessage.updateConversationList]', err),
    );
  };
  //收到消息修改指令
  const otherModifyMessage = (message) => {
    if (message == null || typeof message !== 'object') {
      console.warn('【IM】忽略空编辑消息事件:', message);
      return;
    }
    const { from, to, id, mid, editMessageId, chatType } = message;
    //单对单的撤回to必然为登陆的用户id，群组发起撤回to必然为群组id 所以key可以这样来区分群组或者单人。
    if (!to) {
      console.error(
        '[IM Modify] SDK 编辑事件缺少 to，未更新本地消息或会话',
        message,
      );
      return;
    }
    const messageId = editMessageId || mid || id;
    if (!messageId) {
      console.warn('【IM】编辑消息事件缺少原消息 ID，已忽略:', message);
      return;
    }
    const localMessage = store.getters.getMessageById?.(messageId);
    const resolvedChatType = chatType || localMessage?.chatType;
    const resolvedTo = to || localMessage?.to;
    const resolvedMessage = {
      ...message,
      to: resolvedTo,
      chatType: resolvedChatType,
    };
    if (!resolvedChatType) {
      console.error(
        '[IM Modify] SDK 编辑事件缺少 chatType，未更新本地消息或会话',
        {
          messageId,
          from,
          to,
          rawMessage: message,
        },
      );
      return;
    }
    if (!chatType) {
      console.log(
        '[IM Modify] SDK 编辑事件缺少 chatType，使用本地原消息真实 chatType 更新',
        {
          messageId,
          from,
          to,
          resolvedChatType,
          localMessage,
          rawMessage: message,
        },
      );
    }
    const key = setMessageKey(resolvedMessage);
    safeSync('otherModifyMessage.commit', () => {
      store.commit('CHANGE_MESSAGE_BODAY', {
        type: CHANGE_MESSAGE_BODAY_TYPE.MODIFY,
        key,
        mid: messageId,
        message: resolvedMessage,
      });
    });
    Promise.resolve(
      store.dispatch('updateConversationList', {
        conversationId: key,
        chatType: resolvedChatType,
      }),
    ).catch((err) =>
      console.error('[otherModifyMessage.updateConversationList]', err),
    );
  };
  const mountReviceMessageEventListener = () => {
    /* message 相关监听 */
    requireManager('chatManager').addEventHandler(
      'messageListen',
      wrapImEventHandler({
        // 全局消息监听器，接收所有类型的消息
        onMessage: function (message) {
          pushNewMessage(message);
        }, // 收到所有类型的消息

        onStreamMessage: function (message) {
          pushStreamMessage(message);
        }, // 收到流式消息。
        onMessageRecalled: function (message) {
          otherRecallMessage(message);
        }, // 收到消息撤回回执。
        onMessageUpdated: function (message) {
          otherModifyMessage(message);
        },
      }),
    );
  };
  return {
    mountReviceMessageEventListener,
    pushNewMessage,
    pushStreamMessage,
    otherModifyMessage,
    otherRecallMessage,
  };
};
