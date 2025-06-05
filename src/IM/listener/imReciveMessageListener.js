import { EMClient } from '../index';
import { CHAT_TYPE } from '../constant';
import { CHANGE_MESSAGE_BODAY_TYPE } from '@/constant';
import { setMessageKey } from '@/utils/handleSomeData';
import store from '@/store';
export const imReviceMessageListener = () => {
  //接收的消息往store中push
  const pushNewMessage = (message) => {
    store.dispatch('createNewMessage', message);
    store.dispatch('UsersProfile/processMessageExt', message, { root: true });
  };
  //收到他人的撤回指令
  const otherRecallMessage = (message) => {
    const { from, to, mid } = message;
    //单对单的撤回to必然为登陆的用户id，群组发起撤回to必然为群组id 所以key可以这样来区分群组或者单人。
    const key = to === EMClient.user ? from : to;

    const chatType = to === EMClient.user ? CHAT_TYPE.SINGLE : CHAT_TYPE.GROUP;
    store.commit('CHANGE_MESSAGE_BODAY', {
      type: CHANGE_MESSAGE_BODAY_TYPE.RECALL,
      key,
      mid,
    });
    store.dispatch('updateConversationList', {
      conversationId: key,
      chatType,
    });
  };
  //收到消息修改指令
  const otherModifyMessage = (message) => {
    const { from, to, id: mid, chatType } = message;
    //单对单的撤回to必然为登陆的用户id，群组发起撤回to必然为群组id 所以key可以这样来区分群组或者单人。
    if (!to) return;
    const key = to === EMClient.user ? from : to;
    store.commit('CHANGE_MESSAGE_BODAY', {
      type: CHANGE_MESSAGE_BODAY_TYPE.MODIFY,
      key,
      mid,
      message,
    });
    store.dispatch('updateConversationList', {
      conversationId: key,
      chatType,
    });
  };
  const mountReviceMessageEventListener = () => {
    /* message 相关监听 */
    EMClient.addEventHandler('messageListen', {
      onTextMessage: function (message) {
        pushNewMessage(message);
      }, // 收到文本消息。
      onEmojiMessage: function (message) {
        pushNewMessage(message);
      }, // 收到表情消息。
      onImageMessage: function (message) {
        pushNewMessage(message);
      }, // 收到图片消息。
      onCmdMessage: function (message) {}, // 收到命令消息。
      onAudioMessage: function (message) {
        pushNewMessage(message);
      }, // 收到音频消息。
      onLocationMessage: function (message) {
        pushNewMessage(message);
      }, // 收到位置消息。
      onFileMessage: function (message) {
        pushNewMessage(message);
      }, // 收到文件消息。
      onCustomMessage: function (message) {
        pushNewMessage(message);
      }, // 收到自定义消息。
      onVideoMessage: function (message) {
        pushNewMessage(message);
      }, // 收到视频消息。
      onRecallMessage: function (message) {
        otherRecallMessage(message);
      }, // 收到消息撤回回执。
      onModifiedMessage: function (message) {
        otherModifyMessage(message);
      },
    });
  };
  return {
    mountReviceMessageEventListener,
    pushNewMessage,
    otherModifyMessage,
    otherRecallMessage,
  };
};
