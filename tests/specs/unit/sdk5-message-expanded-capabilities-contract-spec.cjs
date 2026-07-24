const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const messageStore = read('src/store/modules/message.js');
const conversationStore = read('src/store/modules/conversation.js');
const messageItem = read(
  'src/views/Chat/components/Message/components/ChatMessageListItem/index.vue',
);
const messagePage = read('src/views/Chat/components/Message/index.vue');
const conversationList = read(
  'src/views/Chat/components/Conversation/components/ConversationList.vue',
);

assert.match(messageStore, /downloadAttachment\(\s*\{\s*message/s);
assert.match(messageStore, /getPinnedMessageList\(\s*\{/);
assert.match(messageStore, /getGroupMessageReadUsers\(\s*\{/);
assert.match(messageStore, /getGroupMessageReadReceipts\(\s*\{/);

assert.match(conversationStore, /clearAllConversationUnreadMessageCount\(\s*\)/);
assert.match(conversationStore, /clearAllMessagesAndConversations\(\s*\)/);

assert.match(messageItem, /downloadMessageAttachment/);
assert.match(messageItem, /openGroupReadUsersDialog/);
assert.match(messageItem, /openGroupReadReceiptsDialog/);
assert.match(messageItem, /message_attachment_download_result/);
assert.match(messageItem, /group_message_read_users_dialog/);
assert.match(messageItem, /group_message_read_receipts_dialog/);

assert.match(messagePage, /pinnedMessageListDrawer/);
assert.match(messagePage, /fetchPinnedMessageList/);
assert.match(messagePage, /store\.dispatch\(\s*['"]getPinnedMessageList['"]/);

assert.match(conversationList, /clearAllConversationUnreadMessageCount/);
assert.match(conversationList, /clearAllMessagesAndConversations/);

for (const source of [
  messageStore,
  conversationStore,
  messageItem,
  messagePage,
  conversationList,
]) {
  assert.doesNotMatch(source, /\bEMClient\b|\bconn\b/);
}

console.log('sdk5 expanded message capabilities contract: PASS');
