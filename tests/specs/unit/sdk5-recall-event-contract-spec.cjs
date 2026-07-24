const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const listener = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/listener/imReciveMessageListener.js'),
  'utf8',
);
const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);
const conversationStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/conversation.js'),
  'utf8',
);
const casesList = fs.readFileSync(
  path.resolve(__dirname, '../../../cases_list.md'),
  'utf8',
);
const superpowers = fs.readFileSync(
  path.resolve(__dirname, '../../../.codex/prompts/superpowers.md'),
  'utf8',
);
const recallHandler = listener.slice(
  listener.indexOf('const otherRecallMessage'),
  listener.indexOf('const otherModifyMessage'),
);
const recallAction = messageStore.slice(
  messageStore.indexOf('recallMessage: async'),
  messageStore.indexOf('//修改（编辑）消息'),
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
  /conversationType,/,
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
assert.match(
  recallAction,
  /chatManager\(\)\.recallMessage\(\{\s*conversationId,\s*conversationType,\s*messageId,\s*\}\)/s,
  'Recall must call the SDK 5.0 public API with conversationId, conversationType, and messageId.',
);
assert.match(
  recallAction,
  /dispatch\('updateConversationList', \{\s*conversationId: key,\s*conversationType,\s*\}\)/s,
  'Recall may refresh the SDK 5.0 conversation snapshot after the recall result resolves.',
);
assert.match(
  conversationStore,
  /console\.warn\('\[Conversation\] SDK 5\.0 cache has no conversation snapshot'/,
  'A missing SDK 5.0 conversation snapshot is a non-blocking cache miss and must not look like a recall failure.',
);
assert.doesNotMatch(
  conversationStore,
  /console\.error\('\[Conversation\] SDK 5\.0 cache has no conversation snapshot'/,
  'A missing SDK 5.0 conversation snapshot must not be printed as a red console error.',
);
assert.match(
  casesList,
  /撤回；调用 SDK 5\.0 `recallMessage\(\{ conversationId, conversationType, messageId \}\)`，成功后本地标记消息为撤回；若随后刷新会话列表时 SDK cache 暂无会话快照，只记录非阻塞 warning，不展示为撤回失败/,
);
assert.match(
  superpowers,
  /撤回消息必须只调用 SDK 5\.0 `recallMessage\(\{ conversationId, conversationType, messageId \}\)`[\s\S]*SDK cache 暂无该会话，只能记录包含 currentUser\/conversationId\/conversationType 的非阻塞 warning，不得以 `console\.error` 或 toast 展示为撤回失败/,
);

console.log('sdk5 recall event contract: PASS');
