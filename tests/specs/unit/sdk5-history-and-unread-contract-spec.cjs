const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const messageView = read('src/views/Chat/components/Message/index.vue');
const conversationList = read(
  'src/views/Chat/components/Conversation/components/ConversationList.vue',
);

assert.match(messageView, /conversationId:\s*'',/);
assert.match(messageView, /conversationType:\s*CONVERSATION_TYPE\.SINGLE,/);
assert.match(
  messageView,
  /getHistoryMessage',[\s\S]*conversationId:\s*routeQueryData\.value\.conversationId,[\s\S]*conversationType:\s*routeQueryData\.value\.conversationType/,
);
assert.doesNotMatch(messageView, /\.\.\.routeQueryData\.value/);
assert.match(
  messageView,
  /const canClearConversationUnreadCount = \(conversationType\) =>\s*\[\s*CONVERSATION_TYPE\.SINGLE,\s*CONVERSATION_TYPE\.GROUP,\s*\]\.includes\(conversationType\);/s,
);
assert.match(
  messageView,
  /if \(!canClearConversationUnreadCount\(conversationType\)\) return;[\s\S]*store\.dispatch\('clearConversationUnreadCount'/,
);

assert.match(conversationList, /const \{ conversationId, unreadCount, customField, conversationType \}/);
assert.match(
  conversationList,
  /clearConversationUnreadCount',[\s\S]*\n\s*conversationType,/
);
assert.doesNotMatch(conversationList, /chatType:\s*conversationType/);

console.log('sdk5 history and unread contract: PASS');
