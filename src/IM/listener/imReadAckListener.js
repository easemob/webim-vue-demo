import { getCurrentUserId, requireManager } from '../index';
import store from '@/store';
import { MESSAGE_STATUS_TYPE } from '@/constant';
import { wrapImEventHandler } from '@/utils/safeCall';

export const imReadAckListener = () => {
  const mountReadAckEventListener = () => {
    requireManager('chatManager').addEventHandler(
      'aboutReadAckMessage',
      wrapImEventHandler({
        onMessageReceipts: (message) => {
          updateMessageReadStatus(message);
        },
        onConversationUnreadMessageCountCleared: (message) => {
          updateConversationReadStatus(message);
        },
      }),
    );
  };
  //根据收到的单条消息已读回执更新消息已读状态状态
  const updateMessageReadStatus = (message) => {
    if (!message || typeof message !== 'object') {
      console.warn('[updateMessageReadStatus] 无效 message', message);
      return;
    }
    const { mid, to, from } = message;
    const key = to === getCurrentUserId() ? from : to;
    const payload = {
      id: mid,
      key,
      type: MESSAGE_STATUS_TYPE.READ_STATUS,
    };
    store.commit('UPDATE_MESSAGE_IDS_COLLECTION', payload);
  };
  //根据收到会话已读回执更新整个会话为已读状态
  const updateConversationReadStatus = (message) => {
    if (!message || typeof message !== 'object') {
      console.warn('[updateConversationReadStatus] 无效 message', message);
      return;
    }
    const { to, from } = message;
    const key = to === getCurrentUserId() ? from : to;
    const payload = {
      key,
      type: MESSAGE_STATUS_TYPE.CHANLE_STATUS,
    };
    store.commit('UPDATE_MESSAGE_IDS_COLLECTION', payload);
    store.commit('CLEAR_CONVERSATION_ITEM_UNREAD_COUNT', key);
  };
  return {
    mountReadAckEventListener,
  };
};
