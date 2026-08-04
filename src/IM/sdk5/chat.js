const { requireManager, getClient } = require('./client');
const { CONVERSATION_TYPE } = require('../constant');

const builders = {
  text: 'createTextMessage',
  image: 'createImageMessage',
  file: 'createFileMessage',
  voice: 'createVoiceMessage',
  video: 'createVideoMessage',
  location: 'createLocationMessage',
  cmd: 'createCmdMessage',
  custom: 'createCustomMessage',
  combine: 'createCombineMessage',
};

function withNeedReadReceipt(params) {
  const messageParams = { ...params };
  const supportsReadReceipt =
    params?.conversationType === CONVERSATION_TYPE.SINGLE ||
    params?.conversationType === CONVERSATION_TYPE.GROUP;
  if (!supportsReadReceipt) {
    delete messageParams.needReadReceipt;
    return messageParams;
  }
  return {
    ...messageParams,
    needReadReceipt: true,
  };
}

function createMessage(type, params) {
  const builder = builders[type];
  if (!builder) throw new Error(`SDK 5.0 does not support message type ${type}`);
  if (!params.conversationId || !params.conversationType) {
    throw new Error('SDK 5.0 message requires conversationId and conversationType');
  }
  return requireManager('chatManager')[builder]({
    ...withNeedReadReceipt(params),
    conversationId: params.conversationId,
    conversationType: params.conversationType,
  });
}

async function sendMessage(message, options = {}) {
  return requireManager('chatManager').sendMessage(message, options);
}

async function sendMessageByClient(message, options = {}) {
  return getClient().sendMessage(message, options);
}

function setCurrentConversation(params) {
  if (!params?.conversationId || !params?.conversationType) {
    throw new Error('SDK 5.0 current conversation requires conversationId and conversationType');
  }
  requireManager('chatManager').setCurrentConversation({
    conversationId: params.conversationId,
    conversationType: params.conversationType,
  });
}

function resetCurrentConversation() {
  requireManager('chatManager').resetCurrentConversation();
}

function getCurrentConversation() {
  return requireManager('chatManager').getCurrentConversation();
}

module.exports = {
  createMessage,
  sendMessage,
  sendMessageByClient,
  setCurrentConversation,
  resetCurrentConversation,
  getCurrentConversation,
};
