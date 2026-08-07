const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const messageStore = read('src/store/modules/message.js');
const messageView = read('src/views/Chat/components/Message/index.vue');
const conversationList = read(
  'src/views/Chat/components/Conversation/components/ConversationList.vue',
);

assert.match(
  messageView,
  /const newlyDisplayedMessages\s*=\s*messageData\.value\.filter\([\s\S]*?store\.dispatch\('sendIncomingMessageReadReceipt',\s*\{[\s\S]*?messages:\s*newlyDisplayedMessages,/s,
  'Only messages that have completed rendering may enter the SDK 5.0 read-receipt flow.',
);
assert.match(
  messageStore,
  /const receiptCandidates\s*=\s*incomingMessages\.filter\([\s\S]*?message\?\.direct\s*===\s*'RECEIVE'[\s\S]*?message\?\.needReadReceipt\s*===\s*true[\s\S]*?message\.msgServerId[\s\S]*?message\.conversationType === CONVERSATION_TYPE\.SINGLE[\s\S]*?message\.conversationType === CONVERSATION_TYPE\.GROUP[\s\S]*?\);/,
  'Only original received single-chat/group-chat messages that request a receipt and have a server ID are eligible.',
);
assert.match(
  messageStore,
  /const receiptMessages\s*=\s*receiptCandidates;/,
  'A message that is actually rendered must not be excluded merely because a menu action previously advanced readAt.',
);
assert.doesNotMatch(
  messageStore,
  /message\.timestamp\s*>\s*readAt/,
  'readAt must not suppress a read receipt for a message the user has actually viewed.',
);
assert.match(
  messageStore,
  /chatManager\(\)\.sendMessageReadReceipts\(\{[\s\S]*?conversationId,[\s\S]*?conversationType,[\s\S]*?messageIds,/s,
  'Eligible viewed messages must be sent through the real SDK 5.0 read-receipt API.',
);
assert.match(
  conversationList,
  /const clearConversationUnreadFromMenu = async \(conversationItem\) => \{[\s\S]*?await store\.dispatch\('clearConversationUnreadCount', \{[\s\S]*?conversationId,[\s\S]*?conversationType,[\s\S]*?\}\);/s,
  'The manual unread-clear flow remains unchanged.',
);

console.log('sdk5 viewed-message read receipt contract: PASS');
