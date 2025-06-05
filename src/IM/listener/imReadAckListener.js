import { EMClient } from '../index';
import store from '@/store';
import { MESSAGE_STATUS_TYPE } from '@/constant';
export const imReadAckListener = () => {
  const mountReadAckEventListener = () => {
    console.log('mountReadAckEventListener');
    EMClient.addEventHandler('aboutReadAckMessage', {
      // 当前用户收到消息已读回执。
      onReadMessage: (message) => {
        updateMessageReadStatus(message);
      },
      // 当前用户收到会话已读回执。
      onChannelMessage: (message) => {
        updateConversationReadStatus(message);
      },
    });
  };
  //根据收到的单条消息已读回执更新消息已读状态状态
  const updateMessageReadStatus = (message) => {
    const { mid, to, from } = message;
    const key = to === EMClient.user ? from : to;
    const payload = {
      id: mid,
      key,
      type: MESSAGE_STATUS_TYPE.READ_STATUS,
    };
    store.commit('UPDATE_MESSAGE_IDS_COLLECTION', payload);
  };
  //根据收到会话已读回执更新整个会话为已读状态
  const updateConversationReadStatus = (message) => {
    const { to, from } = message;
    const key = to === EMClient.user ? from : to;
    const payload = {
      key,
      type: MESSAGE_STATUS_TYPE.CHANLE_STATUS,
    };
    store.commit('UPDATE_MESSAGE_IDS_COLLECTION', payload);
  };
  return {
    mountReadAckEventListener,
  };
};
