const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  requireManager,
  toConversationLocator,
} = require('../../../src/IM/sdk5/client.js');

assert.throws(
  () => requireManager('chatManager'),
  /SDK 5.0 client is not initialized/,
);

assert.deepEqual(
  toConversationLocator({ id: 'user-1', type: 'singleChat' }),
  { conversationId: 'user-1', conversationType: 'singleChat' },
);

assert.throws(
  () => toConversationLocator({ id: 'user-1' }),
  /conversationType is required/,
);

const clientAdapterSource = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/sdk5/client.js'),
  'utf8',
);
assert.match(
  clientAdapterSource,
  /return getClient\(\)\.getCurrentUserId\(\) \|\| '';/,
  'the SDK 5 adapter must use the public getCurrentUserId() method after login.',
);
assert.doesNotMatch(
  clientAdapterSource,
  /getClient\(\)\.userId/,
  'the SDK 5 adapter must not read the removed v4-style userId instance property.',
);

console.log('sdk5 client contract: PASS');
