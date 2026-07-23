import { CONVERSATION_TYPE } from '@/IM/constant';

export const MAX_DIRECTED_MESSAGE_RECEIVERS = 21;

export const supportsDirectedMessage = (conversationType) =>
  conversationType === CONVERSATION_TYPE.GROUP ||
  conversationType === CONVERSATION_TYPE.CHATROOM;

export const normalizeReceiverList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  return String(value || '')
    .split(/[\n,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const appendDirectedMessageOptions = (msgOptions, receiverList) => {
  const normalized = normalizeReceiverList(receiverList);
  if (normalized.length > 0) {
    msgOptions.receiverList = normalized;
    msgOptions.ext = {
      ...(msgOptions.ext || {}),
      ease_chat_uikit_directed_message: true,
      ease_chat_uikit_receiver_list: normalized,
    };
  }
  return msgOptions;
};

export const isDirectedMessage = (message) =>
  Array.isArray(message?.receiverList) && message.receiverList.length > 0;
