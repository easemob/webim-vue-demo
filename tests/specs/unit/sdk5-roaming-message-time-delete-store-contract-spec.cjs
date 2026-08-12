const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);
const start = messageStore.indexOf('removeMessageRoamingBeforeTimestamp:');
const end = messageStore.indexOf('//撤回消息', start);

assert.notEqual(start, -1, 'Store 必须提供按时间删除漫游消息的独立 action。');
assert.notEqual(end, -1, '按时间删除 action 后必须保留现有撤回 action。');

const action = messageStore.slice(start, end);
assert.match(
  action,
  /const \{ conversationId, conversationType, beforeTimestamp \} = params \|\| \{\};/,
  'action 必须只从显式 SDK 5.0 会话参数读取删除边界。',
);
assert.match(action, /conversationType === CONVERSATION_TYPE\.SINGLE/);
assert.match(action, /conversationType === CONVERSATION_TYPE\.GROUP/);
assert.match(action, /Number\.isSafeInteger\(normalizedBeforeTimestamp\)/);
assert.match(action, /beforeTimestamp: normalizedBeforeTimestamp/);
assert.match(action, /removeHistoryMessages\(deleteOptions\)/);
assert.match(action, /\[Demo -> SDK 5\.0 API\] ChatManager\.removeHistoryMessages/);
assert.match(action, /\[Demo <- SDK 5\.0 API\] ChatManager\.removeHistoryMessages failed/);
assert.doesNotMatch(action, /messageIds/);
assert.doesNotMatch(action, /CLEAR_SOMEONE_MESSAGE|CHANGE_MESSAGE_BODAY/);
assert.doesNotMatch(action, /\/notify|fetch\(|axios|XMLHttpRequest/);

console.log('sdk5 roaming message time-delete store contract: PASS');
