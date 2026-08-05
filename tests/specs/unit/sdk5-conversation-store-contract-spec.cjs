const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/conversation.js'),
  'utf8',
);
const conversationList = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Conversation/components/ConversationList.vue',
  ),
  'utf8',
);
const coverage = fs.readFileSync(
  path.resolve(__dirname, '../../../docs/sdk5-api-coverage.md'),
  'utf8',
);
const uncovered = fs.readFileSync(
  path.resolve(__dirname, '../../../docs/sdk5-uncovered-capabilities.md'),
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

assert.match(source, /requireManager\('chatManager'\)/);
assert.match(source, /requireManager\('pushManager'\)/);
assert.match(source, /chatManager\(\)\s*\.getConversationList\(/);
assert.doesNotMatch(
  source,
  /refreshSessionList|refreshConversationListFromServer/,
  'refreshSessionList is an internal SDK 5.0 API and must not be called or exposed by the Demo.',
);
assert.match(source, /chatManager\(\)\.clearConversationUnreadMessageCount/);
assert.doesNotMatch(
  conversationList,
  /刷新会话列表|conversationListRefreshLoading|refreshConversationListFromServer/,
  'The conversation list UI must not expose the internal refreshSessionList capability.',
);
assert.match(
  conversationList,
  /const supportsReadReceipt = \[\s*CONVERSATION_TYPE\.SINGLE,\s*CONVERSATION_TYPE\.GROUP,\s*\]\.includes\(conversationType\);/s,
  '只有单聊和群聊需要 SDK 5.0 会话未读清零与消息已读回执边界。',
);
assert.doesNotMatch(source, /\bCHAT_TYPE\b|\bchatType\b/);
assert.doesNotMatch(source, /\bEMClient\b/);
assert.doesNotMatch(source, /\.localCache\b/);
assert.doesNotMatch(
  source,
  /SDK 5\.0 clearConversationUnreadMessageCount only supports singleChat and groupChat\./,
  'The app must not surface an SDK limitation for an operation it did not send.',
);
assert.match(
  conversationList,
  /const toChatMessage = \(conversationItem, index\) => \{[\s\S]*const supportsReadReceipt =[\s\S]*if \(supportsReadReceipt\) \{[\s\S]*store\.dispatch\('setIncomingReadReceiptBoundary',[\s\S]*emit\('toChatMessage', conversationId, conversationType\);[\s\S]*if \(supportsReadReceipt\) \{[\s\S]*store\.dispatch\('clearConversationUnreadCount', \{\s*conversationId,\s*conversationType,\s*\}\);/,
  '点击单聊或群聊会话时必须先同步路由，再调用 SDK 5.0 清空当前会话未读数；清零请求不得阻塞首次进入会话。',
);
assert.doesNotMatch(
  conversationList,
  /await store\.dispatch\('clearConversationUnreadCount'/,
  'SDK 5.0 清空未读数是独立异步请求，不能阻塞首次点击会话的路由跳转。',
);
assert.doesNotMatch(
  conversationList,
  /debouncedToChatMessage|_\.debounce\(/,
  '进入会话不得增加本地防抖等待；首次点击必须立即路由到消息页。',
);
assert.doesNotMatch(
  conversationList,
  /unreadCount > 0 &&\s*\[CONVERSATION_TYPE\.SINGLE, CONVERSATION_TYPE\.GROUP\]\.includes\(conversationType\)/,
  '用户点击有效单聊或群聊会话时应调用 SDK 清零，不应由本地 unreadCount 猜测是否跳过。',
);
assert.match(conversationList, /lastMessage\?\.sender\?\.userId/);
assert.match(conversationList, /lastMessage\?\.timestamp/);
assert.doesNotMatch(
  conversationList,
  /lastMessage\?\.(?:from|time)\b|const \{ type, msg \}|route\?\.query\?\.id\b/,
);
assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 192 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.match(
  coverage,
  /\| 会话列表与筛选 \| `ChatManager\.getConversationList` \| 是 \| 会话列表、本地筛选、置顶会话筛选均调用 `getConversationList` 读取 SDK 5\.0 当前会话快照。 \| `refreshSessionList` 属于内部接口，不在 Demo 页面暴露，也不计入公开 API 覆盖。 \|/,
);
assert.doesNotMatch(coverage, /refreshSessionList\(\{ includeEmpty: true \}\)|主动刷新入口/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 192 个，未覆盖 12 个；`@internal` 私有方法以及研发确认的 `ChatManager\.refreshSessionList` 内部接口已剔除/,
);
assert.match(
  casesList,
  /会话列表不提供“刷新会话列表”入口；`refreshSessionList` 属于内部接口，不调用、不展示、不计入公开功能覆盖/,
);
assert.match(
  superpowers,
  /会话列表不得暴露“刷新会话列表”入口；`refreshSessionList` 属于内部接口，不调用、不展示、不计入公开功能覆盖/,
);
for (const [documentName, documentSource] of [
  ['cases_list.md', casesList],
  ['sdk5-api-coverage.md', coverage],
  ['.codex/prompts/superpowers.md', superpowers],
]) {
  assert.match(
    documentSource,
    /点击单聊或群聊会话[\s\S]{0,240}clearConversationUnreadMessageCount\(\{ conversationId, conversationType \}\)/,
    `${documentName} 必须记录点击会话时的 SDK 5.0 未读清零。`,
  );
  assert.match(
    documentSource,
    /(?:消息页|页面消息)完成渲染后[\s\S]{0,320}`direct: 'RECEIVE'`、`needReadReceipt: true`、(?:带 )?`msgServerId`[\s\S]{0,240}sendMessageReadReceipts/,
    `${documentName} 必须记录页面渲染完成后才为真实 SDK 5.0 已读消息发送回执。`,
  );
  assert.match(
    documentSource,
    /聊天室不调用(?:已读回执 API)?/,
    `${documentName} 必须说明聊天室不调用 SDK 5.0 已读回执。`,
  );
}

console.log('sdk5 conversation store contract: PASS');
