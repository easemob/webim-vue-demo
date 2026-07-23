const assert = require('node:assert/strict');

const {
  normalizeSdk5Message,
  normalizeSdk5Messages,
  toSdk5CombineMessage,
} = require('../../../src/IM/sdk5/messageAdapter');
const fs = require('node:fs');
const path = require('node:path');

const normalized = normalizeSdk5Message({
  msgLocalId: 'local-1',
  msgServerId: 'server-1',
  type: 'text',
  conversationId: 'tst09',
  conversationType: 'singleChat',
  sender: { userId: 'tst08' },
  timestamp: 1721611200000,
  body: { content: 'SDK5 text' },
  ext: { source: 'sdk5-test' },
});

assert.equal(normalized.id, 'server-1');
assert.equal(normalized.mid, 'server-1');
assert.equal(normalized.msgLocalId, 'local-1');
assert.equal(normalized.msgServerId, 'server-1');
assert.equal(normalized.type, 'txt');
assert.equal(normalized.to, 'tst09');
assert.equal(normalized.from, 'tst08');
assert.equal(normalized.chatType, 'singleChat');
assert.equal(normalized.time, 1721611200000);
assert.equal(normalized.msg, 'SDK5 text');
assert.deepEqual(normalized.ext, { source: 'sdk5-test' });

const historyMessages = normalizeSdk5Messages([
  {
    msgServerId: 'history-1',
    type: 'custom',
    conversationId: 'group-1',
    conversationType: 'groupChat',
    sender: { userId: 'tst09' },
    timestamp: 1721611200001,
    body: { event: 'history-event', params: { source: 'history' } },
    ext: {},
  },
]);
assert.equal(historyMessages[0].chatType, 'groupChat');
assert.equal(historyMessages[0].to, 'group-1');
assert.equal(historyMessages[0].customEvent, 'history-event');
assert.deepEqual(
  historyMessages[0].customExts,
  { source: 'history' },
  'SDK 5.0 custom-message content must be read from CustomMessageBody.params.',
);

const chatroomCustomMessage = normalizeSdk5Message({
  msgServerId: 'chatroom-custom-1',
  type: 'custom',
  conversationId: 'chatroom-1',
  conversationType: 'chatRoom',
  sender: { userId: 'tst09' },
  timestamp: 1721611200001,
  body: { event: 'customEvent', params: { key: 'value' } },
  ext: { profile: 'sender-extension' },
});
assert.equal(chatroomCustomMessage.chatType, 'chatRoom');
assert.equal(chatroomCustomMessage.customEvent, 'customEvent');
assert.deepEqual(
  chatroomCustomMessage.customExts,
  { key: 'value' },
  'Chat-room custom-message content must render only from SDK 5.0 body.params.',
);
assert.deepEqual(
  chatroomCustomMessage.ext,
  { profile: 'sender-extension' },
  'The top-level SDK 5.0 extension must remain separate from custom-message content.',
);

const groupCombineMessage = normalizeSdk5Message({
  msgServerId: 'group-combine-1',
  type: 'combine',
  conversationId: 'group-1',
  conversationType: 'groupChat',
  sender: { userId: 'tst09' },
  timestamp: 1721611200001,
  body: {
    title: '聊天记录',
    summary: '共5条消息',
    messageList: [{ type: 'text' }, { type: 'image' }],
  },
  ext: {},
});
assert.equal(
  groupCombineMessage.title,
  '聊天记录',
  'SDK 5.0 combine-message title must render from CombineMessageBody.title.',
);
assert.equal(
  groupCombineMessage.summary,
  '共5条消息',
  'SDK 5.0 combine-message summary must render from CombineMessageBody.summary.',
);
assert.deepEqual(
  groupCombineMessage.messageList,
  [{ type: 'text' }, { type: 'image' }],
  'SDK 5.0 combine-message count must use the actual downlink body.messageList.',
);

const imageMessage = normalizeSdk5Message({
  msgServerId: 'image-1',
  type: 'image',
  conversationId: 'tst09',
  conversationType: 'singleChat',
  sender: { userId: 'tst08' },
  timestamp: 1721611200002,
  body: {
    localUrl: 'blob:local-image',
    thumbnailUrl: 'https://example.invalid/chatfiles/image?size=small',
    originalImageUrl: 'https://example.invalid/chatfiles/image',
  },
  ext: {},
});
assert.equal(
  imageMessage.thumb,
  'https://example.invalid/chatfiles/image?size=small',
  'SDK 5.0 image thumbnails must render from ImageMessageBody.thumbnailUrl.',
);
assert.equal(
  imageMessage.url,
  'https://example.invalid/chatfiles/image',
  'SDK 5.0 image preview must open ImageMessageBody.originalImageUrl.',
);

const fileMessage = normalizeSdk5Message({
  msgServerId: 'file-1',
  type: 'file',
  conversationId: 'tst09',
  conversationType: 'singleChat',
  sender: { userId: 'tst08' },
  timestamp: 1721611200003,
  body: {
    filename: 'loadtest-ngi.jmx',
    fileLength: 2048,
    url: 'https://example.invalid/chatfiles/loadtest-ngi.jmx',
  },
  ext: {},
});
assert.equal(
  fileMessage.file_length,
  2048,
  'SDK 5.0 file size must render from FileMessageBody.fileLength.',
);

assert.deepEqual(
  toSdk5CombineMessage({
    type: 'txt',
    from: 'tst08',
    to: 'tst09',
    chatType: 'singleChat',
    time: 1721611200002,
    msg: 'combined text',
    ext: { source: 'legacy-demo' },
  }),
  {
    type: 'text',
    sender: { userId: 'tst08' },
    conversationId: 'tst09',
    conversationType: 'singleChat',
    timestamp: 1721611200002,
    body: { content: 'combined text' },
    ext: { source: 'legacy-demo' },
  },
);

const cmdComponent = fs.readFileSync(
  path.resolve(__dirname, '../../../src/views/Chat/components/Message/components/ChatInputBox/components/CmdMessage/index.vue'),
  'utf8',
);
assert.doesNotMatch(cmdComponent, /\bsendResult\b/);

const chatSdk = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/sdk5/chat.js'),
  'utf8',
);
const videoComponent = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Message/components/ChatInputBox/components/VideoMessage/index.vue',
  ),
  'utf8',
);
const chatInputBox = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Message/components/ChatInputBox/index.vue',
  ),
  'utf8',
);
const directedMessage = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Message/components/ChatInputBox/components/DirectedMessage/SendDirectedMessage.vue',
  ),
  'utf8',
);
const directedMessageUtils = fs.readFileSync(
  path.resolve(__dirname, '../../../src/utils/directedMessage.js'),
  'utf8',
);
const messageListItem = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Message/components/ChatMessageListItem/index.vue',
  ),
  'utf8',
);
assert.match(
  chatSdk,
  /img:\s*\{\s*\.\.\.common,\s*data:\s*params\.file\?\.data\s*\|\|\s*params\.file,\s*filename:\s*params\.filename\s*\|\|\s*params\.file\?\.filename,\s*filetype:\s*params\.filetype\s*\|\|\s*params\.file\?\.filetype,\s*width:\s*params\.width,\s*height:\s*params\.height,/s,
  'SDK 5.0 image messages must pass the selected File through data, with image metadata at the top level.',
);
assert.match(
  chatSdk,
  /file:\s*\{\s*\.\.\.common,\s*data:\s*params\.file\?\.data\s*\|\|\s*params\.file,\s*filename:\s*params\.filename\s*\|\|\s*params\.file\?\.filename,\s*filetype:\s*params\.filetype\s*\|\|\s*params\.file\?\.filetype,\s*fileSize:\s*params\.fileSize\s*\|\|\s*params\.file\?\.size,/s,
  'SDK 5.0 file messages must pass the selected File through data, with its real metadata.',
);
assert.match(
  chatSdk,
  /audio:\s*\{\s*\.\.\.common,\s*data:\s*params\.file\?\.data\s*\|\|\s*params\.file,\s*filename:\s*params\.filename\s*\|\|\s*params\.file\?\.filename,\s*filetype:\s*params\.filetype\s*\|\|\s*params\.file\?\.filetype,\s*duration:\s*params\.duration\s*\|\|\s*params\.length,/s,
  'SDK 5.0 voice messages must pass the selected File through data and the required duration.',
);
assert.match(
  chatSdk,
  /const common = \{ \.\.\.conversation, ext: params\.ext, receiverList: params\.receiverList \};/,
  'SDK 5.0 target-message receiverList must be passed to the message creator, not sendMessage options.',
);
assert.match(
  chatSdk,
  /custom:\s*\{\s*\.\.\.common,\s*event:\s*params\.customEvent,\s*params:\s*params\.customExts,\s*ext:\s*params\.ext\s*\}/s,
  'SDK 5.0 custom-message JSON must be passed through createCustomMessage params, separately from top-level ext.',
);
assert.match(
  chatSdk,
  /combine:\s*\{\s*\.\.\.common,\s*messageList:\s*params\.messageList,\s*title:\s*params\.title,\s*summary:\s*params\.summary,\s*compatibleText:\s*params\.compatibleText,\s*ext:\s*params\.ext,?\s*\}/s,
  'SDK 5.0 combine-message creation must forward compatibleText with title, summary, and messageList.',
);
assert.match(
  messageListItem,
  /v-if="Array\.isArray\(msgBody\.messageList\)"/,
  'The combine-message UI must not fabricate a zero count when SDK 5.0 omits body.messageList.',
);
assert.match(
  directedMessageUtils,
  /chatType === CHAT_TYPE\.GROUP \|\| chatType === CHAT_TYPE\.CHATROOM/,
  'The demo must retain SDK 5.0 target-message entry points for both group and chat-room conversations.',
);
assert.match(
  directedMessage,
  /chatType\.value !== CHAT_TYPE\.GROUP &&\s*chatType\.value !== CHAT_TYPE\.CHATROOM/,
  'The directed-message dialog must allow both group and chat-room conversations to reach the real SDK call.',
);
assert.match(
  directedMessage,
  /receiverList: receiverList\.value,[\s\S]*?const message = createMessage\('txt', msgOptions\);/,
  'Group target recipients must be passed to createTextMessage.',
);
assert.match(
  chatInputBox,
  /const duration = await getAudioDuration\(file\);/,
  'Preset audio must derive duration from the actual audio file instead of a fixed value.',
);
assert.match(
  chatInputBox,
  /file:\s*\{[\s\S]*?data:\s*file,[\s\S]*?\},\s*duration,/,
  'Preset audio must derive duration from the actual audio file instead of a fixed value.',
);
assert.match(
  chatSdk,
  /video:\s*\{\s*\.\.\.common,\s*data:\s*params\.file\?\.data\s*\|\|\s*params\.file,\s*filename:\s*params\.filename\s*\|\|\s*params\.file\?\.filename,\s*filetype:\s*params\.filetype\s*\|\|\s*params\.file\?\.filetype,\s*duration:\s*params\.duration\s*\|\|\s*params\.length,/s,
  'SDK 5.0 video messages must pass the selected File through data and the required duration.',
);
assert.match(
  videoComponent,
  /const metadata = await getVideoMetadata\(videoFile\);[\s\S]*?duration: metadata\.duration,[\s\S]*?width: metadata\.width,[\s\S]*?height: metadata\.height,/,
  'Video messages must use browser metadata from the actual selected file instead of a fabricated duration.',
);

console.log('sdk5 message adapter: PASS');
