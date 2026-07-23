const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/conversation.js'),
  'utf8',
);
const conversationList = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Conversation/components/ConversationList.vue',
  ),
  'utf8',
);

assert.match(source, /requireManager\('chatManager'\)/);
assert.match(source, /requireManager\('pushManager'\)/);
assert.match(source, /chatManager\(\)\s*\.getConversationList\(/);
assert.match(source, /chatManager\(\)\.clearConversationUnreadMessageCount/);
assert.match(
  source,
  /\[CHAT_TYPE\.SINGLE, CHAT_TYPE\.GROUP\]\.includes\(chatType\)/,
);
assert.doesNotMatch(
  source,
  /chatType === CHAT_TYPE\.CHATROOM\)\s*\{\s*throw new Error/,
);
assert.doesNotMatch(source, /\bEMClient\b/);
assert.doesNotMatch(source, /\.localCache\b/);
assert.doesNotMatch(
  source,
  /SDK 5\.0 clearConversationUnreadMessageCount only supports singleChat and groupChat\./,
  'The app must not surface an SDK limitation for an operation it did not send.',
);
assert.match(
  conversationList,
  /unReadCount > 0 &&\s*\[CHAT_TYPE\.SINGLE, CHAT_TYPE\.GROUP\]\.includes\(conversationType\)/,
  'Chatroom rows must not dispatch the SDK 5.0 unread-clear operation.',
);

console.log('sdk5 conversation store contract: PASS');
