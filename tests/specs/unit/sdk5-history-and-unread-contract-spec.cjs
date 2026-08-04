const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const messageView = read('src/views/Chat/components/Message/index.vue');
const conversationList = read(
  'src/views/Chat/components/Conversation/components/ConversationList.vue',
);
const messageStore = read('src/store/modules/message.js');

assert.match(messageView, /conversationId:\s*'',/);
assert.match(messageView, /conversationType:\s*CONVERSATION_TYPE\.SINGLE,/);
assert.match(
  messageView,
  /getHistoryMessage',[\s\S]*conversationId:\s*routeQueryData\.value\.conversationId,[\s\S]*conversationType:\s*routeQueryData\.value\.conversationType/,
);
assert.doesNotMatch(messageView, /\.\.\.routeQueryData\.value/);
assert.doesNotMatch(
  messageView,
  /markConversationReadIfNeeded|canClearConversationUnreadCount|clearConversationUnreadCount/,
  '消息页不能重复调用会话未读清零；该 SDK 5.0 请求只能在会话列表点击入口发起一次。',
);

assert.match(
  conversationList,
  /const toChatMessage = async \(conversationItem, index\) => \{[\s\S]*const \{ conversationId, customField, conversationType, readAt, unreadCount \} = conversationItem;[\s\S]*setIncomingReadReceiptBoundary[\s\S]*readAt,[\s\S]*unreadCount,[\s\S]*await store\.dispatch\('clearConversationUnreadCount', \{[\s\S]*conversationId,[\s\S]*conversationType,[\s\S]*\}\);[\s\S]*debouncedToChatMessage\(conversationId, conversationType\);/s,
  '单聊和群聊会话点击时必须在 SDK 未读清零前保留原始 readAt/unreadCount，并在请求结束后进入消息页。',
);
assert.doesNotMatch(
  conversationList,
  /unreadCount > 0 &&/,
  '是否调用 SDK 清零不能由本地 unreadCount 决定。',
);
assert.match(
  conversationList,
  /clearConversationUnreadCount',[\s\S]*\n\s*conversationType,/
);
assert.doesNotMatch(conversationList, /chatType:\s*conversationType/);

assert.match(
  messageStore,
  /\[Demo -> SDK 5\.0 API\] ChatManager\.getHistoryMessages request/,
  'history loading must clearly log the Demo-to-SDK 5.0 request boundary.',
);
assert.match(
  messageStore,
  /\[Demo <- SDK 5\.0 API\] ChatManager\.getHistoryMessages response/,
  'history loading must log the raw SDK 5.0 response at the SDK-to-Demo boundary.',
);
assert.match(
  messageStore,
  /\[Demo <- SDK 5\.0 API\] ChatManager\.getHistoryMessages failed/,
  'history loading must log the raw SDK 5.0 failure at the SDK-to-Demo boundary.',
);
assert.match(
  messageStore,
  /commit\('UPDATE_HISTORY_MESSAGE',[\s\S]*?resolve\(\{[\s\S]*?messages,[\s\S]*?cursor: nextCursor,[\s\S]*?hasMore,[\s\S]*?\}\);/,
  'History results must be written to the Vuex list before the action resolves to the page.',
);

console.log('sdk5 history and unread contract: PASS');
