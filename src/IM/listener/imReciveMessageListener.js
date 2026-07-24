import { requireManager } from '../index';
import { CHANGE_MESSAGE_BODAY_TYPE } from '@/constant';
import store from '@/store';
import { safeSync, wrapImEventHandler } from '@/utils/safeCall';

const CHAT_MESSAGE_LISTENER_ID = 'messageListen';
const messageIdOf = (message) => message?.msgServerId || message?.msgLocalId || '';

export const imReviceMessageListener = () => {
  //接收的消息往store中push
  const pushNewMessage = (message) => {
    if (Array.isArray(message)) {
      console.log('[IM Message] SDK 收到批量消息', {
        messageCount: message.length,
        firstMessageConversationType: message[0]?.conversationType,
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
    console.log('[IM Message] SDK 收到消息', {
      messageId: messageIdOf(message),
      type: message.type,
      conversationId: message.conversationId,
      conversationType: message.conversationType,
      senderId: message.sender?.userId,
      timestamp: message.timestamp,
      isChatThread: message.isChatThread,
      chatThread: message.chatThread,
      body: message.body,
      ext: message.ext,
      rawMessage: message,
    });

    if (!message.conversationId || !message.conversationType || !messageIdOf(message)) {
      console.error('[IM Message] SDK 5.0 消息缺少关键字段，未写入本地消息列表', {
        messageId: messageIdOf(message),
        type: message.type,
        conversationId: message.conversationId,
        conversationType: message.conversationType,
        senderId: message.sender?.userId,
        rawMessage: message,
      });
      return;
    }

    Promise.resolve(store.dispatch('createNewMessage', message)).catch(
      (err) => {
        console.error('[pushNewMessage.createNewMessage]', err);
      },
    );
    Promise.resolve(
      store.dispatch('UsersProfile/processMessageExt', message, {
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
      messageId: messageIdOf(message),
      conversationId: message.conversationId,
      conversationType: message.conversationType,
      senderId: message.sender?.userId,
      body: message.body,
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
    const { messageId, conversationId, conversationType } = message;
    if (!messageId || !conversationId || !conversationType) {
      console.error('[IM Recall] SDK 5.0 recall event is incomplete', {
        messageId,
        conversationId,
        conversationType,
        rawMessage: message,
      });
      return;
    }
    const recalledMessageId = messageId;
    const key = conversationId;
    safeSync('otherRecallMessage.commit', () => {
      store.commit('CHANGE_MESSAGE_BODAY', {
        type: CHANGE_MESSAGE_BODAY_TYPE.RECALL,
        key,
        messageId: recalledMessageId,
      });
    });
    Promise.resolve(
      store.dispatch('updateConversationList', {
        conversationId: key,
        conversationType,
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
    const { messageId, conversationId, conversationType, message: updatedMessage } = message;
    if (!messageId || !conversationId || !conversationType || !updatedMessage) {
      console.error('[IM Modify] SDK 5.0 edit event is incomplete', {
        messageId,
        conversationId,
        conversationType,
        updatedMessage,
        rawMessage: message,
      });
      return;
    }
    const key = conversationId;
    safeSync('otherModifyMessage.commit', () => {
      store.commit('CHANGE_MESSAGE_BODAY', {
        type: CHANGE_MESSAGE_BODAY_TYPE.MODIFY,
        key,
        messageId,
        message: updatedMessage,
      });
    });
    Promise.resolve(
      store.dispatch('updateConversationList', {
        conversationId: key,
        conversationType,
      }),
    ).catch((err) =>
      console.error('[otherModifyMessage.updateConversationList]', err),
    );
  };
  const mountReviceMessageEventListener = () => {
    /* message 相关监听 */
    const manager = requireManager('chatManager');
    manager.removeEventHandler(CHAT_MESSAGE_LISTENER_ID);
    manager.addEventHandler(
      CHAT_MESSAGE_LISTENER_ID,
      wrapImEventHandler({
        // 全局消息监听器，接收所有类型的消息
        onMessage: function (message) {
          pushNewMessage(message);
        }, // 收到所有类型的消息

        onStreamMessage: function (message) {
          pushStreamMessage(message);
        }, // 收到流式消息。
        onMessageDelivered: function (receipt) {
          store.commit('UPDATE_MESSAGE_DELIVERED', {
            messageId: receipt.messageId,
            conversationId: receipt.conversationId,
            conversationType: receipt.conversationType,
          });
          console.log('[Message Delivery] SDK 5.0 receipt', receipt);
        },
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
