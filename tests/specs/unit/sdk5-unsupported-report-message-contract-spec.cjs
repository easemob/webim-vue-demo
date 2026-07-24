const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const messageItem = read(
  'src/views/Chat/components/Message/components/ChatMessageListItem/index.vue',
);
const unsupported = read('docs/sdk5-unsupported-capabilities.md');
const cases = read('cases_list.md');

assert.ok(
  !fs.existsSync(
    path.join(
      root,
      'src/views/Chat/components/Message/components/suit/reportMessage.vue',
    ),
  ),
  'SDK 5.0 exposes no report-message API, so the old report dialog must not remain.',
);
assert.doesNotMatch(messageItem, /ReportMessage|reportMessage|informOnMessage/);
assert.match(
  cases,
  /消息举报当前 SDK 5\.0 未公开 API，Demo 不提供入口/,
);
assert.match(
  unsupported,
  /\| 举报消息 \| 无页面入口 \| `ChatManager` 公开 API 不含 `reportMessage` \| Demo 不提供消息举报入口/,
);

console.log('sdk5 unsupported report-message contract: PASS');
