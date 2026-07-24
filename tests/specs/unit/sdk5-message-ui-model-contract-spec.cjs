const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

for (const relativePath of [
  'src/store/modules/conversation.js',
  'src/views/Chat/components/Message/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/index.vue',
  'src/views/Chat/components/Message/components/ChatMessageListItem/index.vue',
  'src/views/Chat/components/Message/components/MessageSearchDrawer.vue',
  'src/views/Chat/components/Message/components/suit/modifyMessage.vue',
  'src/views/Chat/components/Message/components/suit/quoteMessage.vue',
]) {
  const source = read(relativePath);
  assert.doesNotMatch(source, /\.(mid|chatType|msg|to|from)\b/);
  assert.doesNotMatch(source, /\b(mid|chatType|msg|to|from):/);
}

for (const relativePath of [
  'src/views/Chat/components/Message/components/ChatInputBox/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/SendExtMessage.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/ImageMessage/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/VideoMessage/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/FileMessage/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/CmdMessage/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/CustomMessage/SendCustomMessage.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/CustomMessage/ShareUserCard.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/DirectedMessage/SendDirectedMessage.vue',
  'src/views/Chat/components/Message/components/suit/previewSendImg.vue',
]) {
  const source = read(relativePath);
  assert.match(source, /conversationId/);
  assert.match(source, /conversationType/);
  assert.doesNotMatch(source, /\btargetId\b/);
  assert.doesNotMatch(source, /\bchatType\b/);
  assert.doesNotMatch(source, /\.(mid|to|from)\b/);
  assert.doesNotMatch(source, /\b(mid|to|from):/);
  assert.doesNotMatch(source, /\bmsg\b/);
}

const quoteComposer = read(
  'src/views/Chat/components/Message/components/suit/quoteMessage.vue',
);
assert.match(quoteComposer, /const quote = ref\(null\);/);
assert.doesNotMatch(quoteComposer, /\bmsgQuote\b/);
assert.doesNotMatch(quoteComposer, /\bMESSAGE_TYPE\b|\bSESSION_MESSAGE_TYPE\b/);

const textMessage = read(
  'src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue',
);
assert.match(textMessage, /msgOptions\.ext\.quote = quote;/);
assert.doesNotMatch(textMessage, /msgOptions\.ext\.msgQuote/);

const messageList = read(
  'src/views/Chat/components/Message/components/ChatMessageListItem/index.vue',
);
assert.match(messageList, /msgBody\?\.ext\?\.quote/);
assert.doesNotMatch(messageList, /msgBody\?\.ext\?\.msgQuote/);

console.log('sdk5 message UI model contract: PASS');
