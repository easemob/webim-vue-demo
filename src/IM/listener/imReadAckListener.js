import { requireManager } from '../index';
import store from '@/store';
import { MESSAGE_STATUS_TYPE } from '@/constant';
import { wrapImEventHandler } from '@/utils/safeCall';

const CHAT_READ_ACK_LISTENER_ID = 'aboutReadAckMessage';

export const imReadAckListener = () => {
  const mountReadAckEventListener = () => {
    const manager = requireManager('chatManager');
    manager.removeEventHandler(CHAT_READ_ACK_LISTENER_ID);
    manager.addEventHandler(
      CHAT_READ_ACK_LISTENER_ID,
      wrapImEventHandler({
        onMessageReceipts: (receipts) => {
          updateMessageReadStatus(receipts);
        },
      }),
    );
  };
  // SDK 5.0 onMessageReceipts 传入回执数组；每项以 conversationId、
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
          store.commit('UPDATE_MESSAGE_IDS_COLLECTION', {
            messageId,
            key: receipt.conversationId,
            type: MESSAGE_STATUS_TYPE.READ_STATUS,
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
