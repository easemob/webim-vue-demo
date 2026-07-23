const messageTypeMap = {
  text: 'txt',
  image: 'img',
  file: 'file',
  voice: 'audio',
  video: 'video',
  location: 'loc',
  cmd: 'cmd',
  custom: 'custom',
  combine: 'combine',
};

function normalizeSdk5Message(message) {
  if (!message || typeof message !== 'object') return message;
  if (!message.conversationId || !message.conversationType || !message.body) {
    return message;
  }

  const body = message.body;
  const messageId = message.msgServerId || message.msgLocalId || message.id || '';
  return {
    ...message,
    id: messageId,
    mid: messageId,
    type: messageTypeMap[message.type] || message.type,
    to: message.conversationId,
    from: message.sender?.userId || message.from || '',
    chatType: message.conversationType,
    time: message.timestamp || message.time,
    msg: body.content || message.msg || '',
    ...(body.action ? { action: body.action } : {}),
    ...(body.event ? { customEvent: body.event } : {}),
    ...(body.params ? { customExts: body.params } : {}),
    ...(body.latitude !== undefined ? { lat: body.latitude } : {}),
    ...(body.longitude !== undefined ? { lng: body.longitude } : {}),
    ...(body.address ? { addr: body.address } : {}),
    ...(body.filename ? { filename: body.filename } : {}),
    ...(body.fileLength !== undefined ? { file_length: body.fileLength } : {}),
    ...(body.thumbnailUrl ? { thumb: body.thumbnailUrl } : {}),
    ...(body.originalImageUrl ? { url: body.originalImageUrl } : {}),
    ...(body.url ? { url: body.url } : {}),
    ...(body.duration !== undefined ? { length: body.duration } : {}),
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.summary !== undefined ? { summary: body.summary } : {}),
    ...(body.messageList !== undefined ? { messageList: body.messageList } : {}),
  };
}

function normalizeSdk5Messages(messages) {
  if (!Array.isArray(messages)) return messages;
  return messages.map(normalizeSdk5Message);
}

const sdk5MessageTypeMap = {
  txt: 'text',
  img: 'image',
  audio: 'voice',
  loc: 'location',
};

function toSdk5CombineMessage(message) {
  const normalized = normalizeSdk5Message(message);
  if (!normalized || typeof normalized !== 'object') return normalized;
  if (
    normalized.conversationId &&
    normalized.conversationType &&
    normalized.sender &&
    normalized.body
  ) {
    return normalized;
  }

  const type = sdk5MessageTypeMap[normalized.type] || normalized.type;
  const body =
    type === 'text'
      ? { content: normalized.msg || '' }
      : type === 'custom'
        ? { event: normalized.customEvent || '', params: normalized.customExts || {} }
        : type === 'cmd'
          ? { action: normalized.action || '', params: normalized.ext || {} }
          : type === 'location'
            ? {
                latitude: normalized.lat,
                longitude: normalized.lng,
                address: normalized.addr || '',
              }
            : {
                filename: normalized.filename || '',
                url: normalized.url || '',
                duration: normalized.length,
              };
  return {
    type,
    sender: { userId: normalized.from || '' },
    conversationId: normalized.to || '',
    conversationType: normalized.chatType || '',
    timestamp: normalized.time || Date.now(),
    body,
    ext: normalized.ext || {},
  };
}

module.exports = {
  normalizeSdk5Message,
  normalizeSdk5Messages,
  toSdk5CombineMessage,
};
