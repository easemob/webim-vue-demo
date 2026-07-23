const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

for (const source of [
  read('src/store/modules/message.js'),
  read('src/IM/listener/imReciveMessageListener.js'),
  read('src/IM/listener/imReadAckListener.js'),
  read('src/utils/handleSomeData/setMessageKey.js'),
  read('src/utils/messageThread.js'),
]) {
  assert.doesNotMatch(source, /\.(mid|chatType|msg|to|from)\b/);
  assert.doesNotMatch(source, /\b(mid|chatType|msg|to|from):/);
}

const listener = read('src/IM/listener/imReciveMessageListener.js');
const key = read('src/utils/handleSomeData/setMessageKey.js');
const readAckListener = read('src/IM/listener/imReadAckListener.js');
assert.match(listener, /message\.conversationId/);
assert.match(listener, /message\.conversationType/);
assert.match(listener, /message\.sender\?\.userId/);
assert.match(key, /conversation\.conversationId/);
assert.doesNotMatch(readAckListener, /\bid:\s*messageId/);
assert.match(readAckListener, /messageId,/);

console.log('sdk5 message core model contract: PASS');
