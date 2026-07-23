const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);

assert.match(
  messageStore,
  /getReactionList\(\{\s*messageId,\s*conversationType: chatType,\s*groupId,/s,
  'WebSDK 5.0 group reaction queries must forward groupId, not a legacy conversationId field.',
);
assert.doesNotMatch(
  messageStore,
  /conversationId:\s*groupId\s*\|\|\s*params\?\.conversationId/,
  'WebSDK 5.0 getReactionList does not accept conversationId.',
);

console.log('sdk5 reaction contract: PASS');
