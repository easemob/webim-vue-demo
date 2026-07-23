const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const listener = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/listener/imReciveMessageListener.js'),
  'utf8',
);
const recallHandler = listener.slice(
  listener.indexOf('const otherRecallMessage'),
  listener.indexOf('const otherModifyMessage'),
);

assert.match(
  recallHandler,
  /const \{ messageId, conversationId, conversationType \} = message;/,
  'WebSDK 5.0 recall events must use the public messageId and conversation locator fields.',
);
assert.match(
  recallHandler,
  /const recalledMessageId = messageId;/,
  'The recall handler must use only the WebSDK 5.0 messageId field.',
);
assert.match(
  recallHandler,
  /const key = conversationId;/,
  'WebSDK 5.0 recall events must use conversationId directly as the local message-list key.',
);
assert.match(
  recallHandler,
  /chatType: conversationType,/,
  'WebSDK 5.0 recall events must forward conversationType without legacy field mapping.',
);
assert.doesNotMatch(
  recallHandler,
  /conversationType\s*===|conversationType\s*!==/,
  'The same SDK 5.0 recall locator flow must cover singleChat, groupChat, and chatRoom without type-specific fallbacks.',
);
assert.doesNotMatch(
  recallHandler,
  /localMessage\?\.chatType|message\.chatType|message\.to|setMessageKey\(resolvedMessage\)/,
  'The recall handler must not read or synthesize legacy message fields.',
);

console.log('sdk5 recall event contract: PASS');
