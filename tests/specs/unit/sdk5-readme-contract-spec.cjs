const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const readme = read('README.md');

assert.match(readme, /easemob-websdk 5\.0/);
assert.doesNotMatch(readme, /\b5\.0\.\d+\b/);
assert.match(
  readme,
  /创建聊天室：当前 SDK 5\.0 未公开该 API，Demo 不提供创建入口。/,
);
assert.match(
  readme,
  /onMessageRecalled.*messageId.*conversationId.*conversationType/s,
  'Recall documentation must use the SDK 5.0 event and its public payload fields.',
);
assert.match(
  readme,
  /当前 SDK 5\.0 不提供已加入聊天室列表或聊天室消息免打扰 API，Demo 不提供相应入口。/,
);
assert.doesNotMatch(readme, /`chatType`/);
assert.doesNotMatch(readme, /`onRecallMessage`/);
assert.doesNotMatch(readme, /`id`、`from`、`to`、`mid`/);
assert.doesNotMatch(readme, /- 创建聊天室。/);
assert.doesNotMatch(readme, /- 消息举报。/);
assert.doesNotMatch(readme, /\[消息举报\]/);
assert.doesNotMatch(readme, /- 展示已加入聊天室列表。/);
assert.doesNotMatch(readme, /- 设置聊天室消息免打扰。/);

console.log('sdk5 README contract: PASS');
