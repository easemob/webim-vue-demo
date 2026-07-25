const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const messageStore = read('src/store/modules/message.js');

assert.doesNotMatch(
  messageStore,
  /groupId:\s*message\.groupId/,
  'SDK 5.0 Message has no groupId field; Store metadata must use only native Message fields.',
);

assert.doesNotMatch(
  messageStore,
  /\b(?:mid|chatType|msg)\b/,
  'Message Store must not retain V4 message identity, conversation-type, or body aliases.',
);

console.log('sdk5 message model no legacy fields: PASS');
