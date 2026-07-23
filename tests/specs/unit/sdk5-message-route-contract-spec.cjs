const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const messageRouteSources = [
  'src/views/Chat/components/Conversation/index.vue',
  'src/views/Chat/components/Contacts/components/ContactInfos.vue',
  'src/views/Chat/components/Chatroom/index.vue',
  'src/views/Chat/components/NavBar/components/ApplyComponents/createGroups.vue',
  'src/views/Chat/components/Message/components/MessageThreadListDrawer.vue',
  'src/views/Chat/components/Message/components/ChatContainerHeader/index.vue',
  'src/views/Chat/components/Chatroom/ChatroomDetails.vue',
];

for (const relativePath of messageRouteSources) {
  const source = read(relativePath);
  assert.match(
    source,
    /conversationId/,
    `${relativePath} must pass SDK 5.0 conversationId when opening a message view`,
  );
  assert.match(
    source,
    /conversationType/,
    `${relativePath} must pass SDK 5.0 conversationType when opening a message view`,
  );
  assert.doesNotMatch(
    source,
    /query:\s*\{[\s\S]{0,180}\b(?:id|chatType)\s*:/,
    `${relativePath} must not pass V4 route query fields to a message view`,
  );
}

const messageView = read('src/views/Chat/components/Message/index.vue');
assert.match(messageView, /const \{ conversationId, conversationType, parentConversationId, threadName \} = data;/);
assert.doesNotMatch(messageView, /\bCHAT_TYPE\b/);
assert.match(messageView, /\bCONVERSATION_TYPE\b/);

console.log('sdk5 message route contract: PASS');
