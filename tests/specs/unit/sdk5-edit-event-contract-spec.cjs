const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const listener = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/listener/imReciveMessageListener.js'),
  'utf8',
);
const editHandler = listener.slice(
  listener.indexOf('const otherModifyMessage'),
  listener.indexOf('const mountReviceMessageEventListener'),
);
const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);

assert.match(
  editHandler,
  /const \{ messageId, conversationId, conversationType, message: updatedMessage \} = message;/,
  'WebSDK 5.0 edit events must use messageId, conversationId, conversationType, and message.',
);
assert.match(editHandler, /const key = conversationId;/);
assert.match(editHandler, /chatType: conversationType,/);
assert.doesNotMatch(
  editHandler,
  /message\.(mid|id|to|from|chatType|editMessageId)|setMessageKey\(resolvedMessage\)|localMessage\?\./,
  'The edit handler must not read or synthesize WebSDK 4.0 fields.',
);
assert.match(
  messageStore,
  /const updatedContent = payload\?\.message\?\.body\?\.content;/,
  'The current-page edit path must render text from the WebSDK 5.0 updated message body.',
);
assert.match(
  messageStore,
  /if \(updatedContent !== undefined\) \{\s*res\.msg = updatedContent;/s,
  'The current-page edit path must update the rendered text with body.content.',
);
assert.match(
  messageStore,
  /res\.body = payload\?\.message\?\.body;/,
  'The current-page edit path must retain the WebSDK 5.0 updated body.',
);
assert.doesNotMatch(
  messageStore,
  /case CHANGE_MESSAGE_BODAY_TYPE\.MODIFY:[\s\S]*?_.assign\(res, payload\?\.message\)/,
  'The current-page edit path must not overwrite the demo render type with the SDK 5.0 message type.',
);

console.log('sdk5 edit event contract: PASS');
