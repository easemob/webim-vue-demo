import { getCurrentUserId, requireManager } from '../index';
import store from '@/store';
import { wrapImEventHandler } from '@/utils/safeCall';

const CHAT_READ_ACK_LISTENER_ID = 'aboutReadAckMessage';

export const imReadAckListener = () => {
  const recordSdkEvent = (eventName, payload) => {
    const firstReceipt = Array.isArray(payload) ? payload[0] : payload;
    Promise.resolve(
      store.dispatch('recordSdkEvent', {
        domain:
          firstReceipt?.conversationType === 'groupChat' ? 'group' : 'singleChat',
        eventName,
        payload,
        currentUserId: getCurrentUserId(),
      }),
    ).catch((error) => console.error('[imReadAckListener.recordSdkEvent]', error));
  };
  const mountReadAckEventListener = () => {
    const manager = requireManager('chatManager');
    manager.removeEventHandler(CHAT_READ_ACK_LISTENER_ID);
    manager.addEventHandler(
      CHAT_READ_ACK_LISTENER_ID,
      wrapImEventHandler({
        onMessageReadReceipts: (receipts) => {
          recordSdkEvent('onMessageReadReceipts', receipts);
          console.log('[Demo <- SDK 5.0 Event] ChatManager.onMessageReadReceipts', {
            eventName: 'onMessageReadReceipts',
            receipts,
          });
          updateMessageReadStatus(receipts);
        },
      }),
    );
  };
  // SDK 5.0.3 onMessageReadReceipts 传入回执数组；每项以 conversationId、
  // conversationType 和 messageIds 定位已读消息。
  const updateMessageReadStatus = (receipts) => {
    if (!Array.isArray(receipts)) {
      console.warn('[updateMessageReadStatus] SDK 5.0 回执不是数组', receipts);
      return;
    }
    receipts.forEach((receipt) => {
      if (!receipt?.conversationId || !Array.isArray(receipt.messageIds)) {
        return;
      }
      if (receipt.conversationType === 'singleChat') {
        receipt.messageIds.forEach((messageId) => {
          if (!messageId) return;
          store.commit('UPDATE_MESSAGE_READ', {
            messageId,
            conversationId: receipt.conversationId,
            conversationType: receipt.conversationType,
          });
        });
        return;
      }
      if (receipt.conversationType === 'groupChat') {
        receipt.receiptDetails.forEach(({ messageId, count }) => {
          store.commit('UPDATE_MESSAGE_READ', {
            messageId,
            conversationId: receipt.conversationId,
            conversationType: receipt.conversationType,
            groupReadCount: count,
          });
        });
      }
    });
  };
  return {
    mountReadAckEventListener,
  };
};
