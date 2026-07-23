const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sender = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/sdk5/chat.js'),
  'utf8',
);

assert.equal(
  fs.existsSync(path.resolve(__dirname, '../../../src/IM/sdk5/messageAdapter.js')),
  false,
  'SDK 5.0 messages must not pass through a V4 adapter',
);
assert.doesNotMatch(sender, /params\.(to|chatType|msg|customEvent|customExts)/);
assert.doesNotMatch(sender, /\b(txt|img|audio|loc)\b/);
assert.match(sender, /conversationId: params\.conversationId/);
assert.match(sender, /conversationType: params\.conversationType/);

console.log('sdk5 native message model contract: PASS');
