const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);

assert.match(
  messageStore,
  /\[Message Receipt\] sendMessageReadReceipts selection/,
  '批量已读必须先打印 SDK 5.0 消息筛选事实，避免未触发时无日志。',
);
assert.match(
  messageStore,
  /\[Message Receipt\] sendMessageReadReceipts selected messages/,
  '批量已读必须打印最终选中的 SDK 5.0 messageIds。',
);
assert.match(messageStore, /candidateMessageCount/);
assert.match(messageStore, /selectedMessageCount/);
assert.match(messageStore, /messageIds/);
assert.doesNotMatch(
  messageStore,
  /sendMessageReadReceipts skipped/,
  '不要恢复旧的 skipped 语义日志。',
);

console.log('sdk5 read receipt logging contract: PASS');
