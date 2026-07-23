const { requireManager } = require('./client');

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

function createMessage(type, params) {
  const builder = builders[type];
  if (!builder) throw new Error(`SDK 5.0 does not support message type ${type}`);
  if (!params.conversationId || !params.conversationType) {
    throw new Error('SDK 5.0 message requires conversationId and conversationType');
  }
  return requireManager('chatManager')[builder]({
    ...params,
    conversationId: params.conversationId,
    conversationType: params.conversationType,
  });
}

async function sendMessage(message, options = {}) {
  return requireManager('chatManager').sendMessage(message, options);
}

module.exports = { createMessage, sendMessage };
