const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const readAck = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/listener/imReadAckListener.js'),
  'utf8',
);
const reaction = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/listener/imReactionListener.js'),
  'utf8',
);

assert.match(
  readAck,
  /onMessageReadReceipts:\s*\(receipts\)/,
  'SDK 5.0 must register the native onMessageReadReceipts event.',
);
assert.doesNotMatch(
  readAck,
  /\bonMessageReceipts\b/,
  'SDK 5.0 must not register the removed onMessageReceipts event.',
);
assert.match(
  readAck,
  /conversationType[\s\S]*conversationId[\s\S]*messageIds/,
  'SDK 5.0 read receipts must consume their native payload fields.',
);
assert.doesNotMatch(
  readAck,
  /const \{ mid, to, from \} = message;/,
  'SDK 5.0 read receipts must not use V4 mid/to/from fields.',
);
assert.match(
  reaction,
  /conversationType: reactionMsg\?\.conversationType/,
  'SDK 5.0 reaction events must log conversationType.',
);
assert.doesNotMatch(
  reaction,
  /reactionMsg\?\.chatType/,
  'SDK 5.0 reaction events must not read V4 chatType.',
);

console.log('sdk5 single chat event payload contract: PASS');
