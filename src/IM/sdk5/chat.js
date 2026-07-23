const { requireManager, toConversationLocator } = require('./client');
const { normalizeSdk5Message } = require('./messageAdapter');

const builders = {
  txt: 'createTextMessage',
  img: 'createImageMessage',
  file: 'createFileMessage',
  audio: 'createVoiceMessage',
  video: 'createVideoMessage',
  loc: 'createLocationMessage',
  cmd: 'createCmdMessage',
  custom: 'createCustomMessage',
  combine: 'createCombineMessage',
};

function createMessage(type, params) {
  const builder = builders[type];
  if (!builder) throw new Error(`SDK 5.0 does not support message type ${type}`);
  const manager = requireManager('chatManager');
  const conversation = toConversationLocator({
    id: params.conversationId || params.to,
    type: params.conversationType || params.chatType,
  });
  const common = { ...conversation, ext: params.ext, receiverList: params.receiverList };
  const mapped = {
    txt: { ...common, content: params.msg },
    img: {
      ...common,
      data: params.file?.data || params.file,
      filename: params.filename || params.file?.filename,
      filetype: params.filetype || params.file?.filetype,
      width: params.width,
      height: params.height,
      ext: params.ext,
    },
    file: {
      ...common,
      data: params.file?.data || params.file,
      filename: params.filename || params.file?.filename,
      filetype: params.filetype || params.file?.filetype,
      fileSize: params.fileSize || params.file?.size,
      ext: params.ext,
    },
    audio: {
      ...common,
      data: params.file?.data || params.file,
      filename: params.filename || params.file?.filename,
      filetype: params.filetype || params.file?.filetype,
      duration: params.duration || params.length,
      ext: params.ext,
    },
    video: {
      ...common,
      data: params.file?.data || params.file,
      filename: params.filename || params.file?.filename,
      filetype: params.filetype || params.file?.filetype,
      duration: params.duration || params.length,
      width: params.width,
      height: params.height,
      ext: params.ext,
    },
    loc: { ...common, latitude: params.lat, longitude: params.lng, address: params.addr, ext: params.ext },
    cmd: { ...common, action: params.action, ext: params.ext },
    custom: { ...common, event: params.customEvent, params: params.customExts, ext: params.ext },
    combine: {
      ...common,
      messageList: params.messageList,
      title: params.title,
      summary: params.summary,
      compatibleText: params.compatibleText,
      ext: params.ext,
    },
  };
  return manager[builder](mapped[type]);
}

async function sendMessage(message, options = {}) {
  const result = await requireManager('chatManager').sendMessage(message, options);
  return normalizeSdk5Message(result);
}

module.exports = { createMessage, sendMessage };
