const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const drawer = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Message/components/MessageThreadListDrawer.vue',
  ),
  'utf8',
);

assert.match(drawer, /const latestMessages = response\.items;/);
assert.match(
  drawer,
  /threads\.value = loadMore \? \[\.\.\.threads\.value, \.\.\.response\.items\] : response\.items;/,
  'SDK 5.0 chat-thread list responses must be consumed directly through items.',
);
assert.doesNotMatch(
  drawer,
  /normalizeThread(?:Detail|Members|List|LatestMessage)Response/,
  'The thread drawer must not reshape SDK 5.0 thread responses.',
);
assert.match(
  drawer,
  /member\?\.memberId \|\| ''/,
  'SDK 5.0 chat-thread member and latest-message responses expose items.',
);
assert.doesNotMatch(
  drawer,
  /response\?\.entities|response\?\.data\?\.entities|response\?\.data\?\.list|response\?\.list/,
  'Thread drawer must not parse v4 response fields.',
);
assert.doesNotMatch(
  drawer,
  /\b(?:MESSAGE_TYPE|SESSION_MESSAGE_TYPE)\b/,
  'Thread latest-message rendering must switch on the SDK 5.0 raw message.type value.',
);

const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);
const threadListener = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/listener/imThreadListener.js'),
  'utf8',
);

assert.match(
  messageStore,
  /const getChatThreadEntity = \(chatThreadId\) =>\s*chatThreadManager\(\)\.getChatThread\(chatThreadId\);/s,
  'Single chat-thread operations must enter through SDK 5.0 ChatThread facade.',
);
assert.match(messageStore, /getChatThreadEntity\(chatThreadId\)\.getInfo\(\)/);
assert.match(messageStore, /getChatThreadEntity\(chatThreadId\)\.refresh\(\)/);
assert.match(messageStore, /getChatThreadEntity\(chatThreadId\)\.join\(\)/);
assert.match(messageStore, /getChatThreadEntity\(chatThreadId\)\.leave\(\)/);
assert.match(messageStore, /getChatThreadEntity\(chatThreadId\)\.destroy\(\)/);
assert.match(
  messageStore,
  /getChatThreadEntity\(chatThreadId\)\.updateName\(\{\s*name\s*,?\s*\}\)/s,
);
assert.match(
  messageStore,
  /getChatThreadEntity\(chatThreadId\)\.getMemberList\(\{\s*cursor,\s*pageSize,\s*\}\)/s,
);
assert.match(
  messageStore,
  /getChatThreadEntity\(chatThreadId\)\.removeMember\(\{\s*memberId,\s*\}\)/s,
  'SDK 5.0 ChatThread.removeMember requires memberId.',
);
assert.doesNotMatch(
  messageStore,
  /chatThreadManager\(\)\.(joinChatThread|leaveChatThread|destroyChatThread|updateChatThreadName|getChatThreadInfo|getChatThreadMemberList|removeChatThreadMember)\(/,
  'Single chat-thread operations must not stay on manager direct methods after facade coverage is enabled.',
);
assert.doesNotMatch(
  messageStore,
  /callThreadApi\('(joinChatThread|leaveChatThread|destroyChatThread|changeChatThreadName|getChatThreadDetail|refreshChatThreadDetail|getChatThreadMembers|removeChatThreadMember)'/,
  'Single chat-thread operation logs must identify the SDK 5.0 ChatThread facade method, not the manager direct method.',
);
assert.match(messageStore, /callThreadApi\('ChatThread\.getInfo'/);
assert.match(messageStore, /callThreadApi\('ChatThread\.refresh'/);
assert.match(messageStore, /callThreadApi\('ChatThread\.join'/);
assert.match(messageStore, /callThreadApi\('ChatThread\.leave'/);
assert.match(messageStore, /callThreadApi\('ChatThread\.destroy'/);
assert.match(messageStore, /callThreadApi\('ChatThread\.updateName'/);
assert.match(messageStore, /callThreadApi\('ChatThread\.getMemberList'/);
assert.match(messageStore, /callThreadApi\('ChatThread\.removeMember'/);

assert.match(
  threadListener,
  /const CHAT_THREAD_LISTENER_ID = 'THREAD';/,
  'Chat-thread listener id must be explicit so add/remove use the same SDK 5.0 handler name.',
);
assert.match(
  threadListener,
  /\.removeEventHandler\(\s*CHAT_THREAD_LISTENER_ID\s*\)/,
  'ChatThreadManager.removeEventHandler must be covered before re-registering the listener.',
);
assert.match(
  threadListener,
  /\.addEventHandler\(\s*CHAT_THREAD_LISTENER_ID\s*,/s,
  'ChatThreadManager.addEventHandler must keep using the same SDK 5.0 handler name.',
);
assert.match(threadListener, /onChatThreadCreated:/);
assert.match(threadListener, /onChatThreadDestroyed:/);
assert.match(threadListener, /onChatThreadUpdated:/);
assert.match(threadListener, /onChatThreadUserRemoved:/);
assert.match(threadListener, /payload\?\.chatThreadId/);
assert.match(threadListener, /payload\?\.parentId/);
assert.match(threadListener, /payload\?\.operatorId/);
assert.match(threadListener, /payload\?\.chatThreadName/);
assert.match(threadListener, /payload\?\.memberId/);
assert.doesNotMatch(
  threadListener,
  /payload\?\.(id|name|operator|userName)\b|threadEvent\?\.(id|name|operator|userName)\b/,
  'Chat-thread listener must not read legacy event aliases.',
);

console.log('sdk5 thread drawer contract: PASS');
