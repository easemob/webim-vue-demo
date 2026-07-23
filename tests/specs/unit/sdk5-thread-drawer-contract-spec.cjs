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

assert.match(
  drawer,
  /const entities = response\?\.items \|\| \[\];/,
  'SDK 5.0 chat-thread list responses expose items.',
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

const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);
assert.match(
  messageStore,
  /removeChatThreadMember\(\{\s*chatThreadId,\s*memberId:\s*username,\s*\}\)/s,
  'SDK 5.0 removeChatThreadMember requires memberId.',
);

console.log('sdk5 thread drawer contract: PASS');
