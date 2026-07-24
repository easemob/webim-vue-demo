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
assert.match(
  source,
  /refreshConversationListFromServer: async \(\{ commit, dispatch \}, params = \{\}\) => \{[\s\S]*const refreshParams = \{[\s\S]*includeEmpty: params\.includeEmpty !== false,[\s\S]*\};[\s\S]*const conversations = await chatManager\(\)\.refreshSessionList\(refreshParams\);[\s\S]*commit\('GET_CONVERSATION_LIST_FROM_SERVER', \{[\s\S]*isInit: true,[\s\S]*conversationListData: conversations,[\s\S]*\}\);[\s\S]*dispatch\('callGroupDetailWithConversationId', conversations\);[\s\S]*return conversations;/,
  'The store must expose a manual SDK 5.0 refreshSessionList action and commit the real returned conversations.',
);
assert.match(source, /chatManager\(\)\.clearConversationUnreadMessageCount/);
assert.match(
  conversationList,
  /const conversationListRefreshLoading = ref\(false\);[\s\S]*const refreshConversationListFromServer = async \(\) => \{[\s\S]*await store\.dispatch\('refreshConversationListFromServer', \{ includeEmpty: true \}\);/,
  'The conversation list UI must provide a manual refresh action using SDK 5.0 refreshSessionList.',
);
assert.match(conversationList, /刷新会话列表/);
assert.match(
  conversationList,
  /\[CONVERSATION_TYPE\.SINGLE, CONVERSATION_TYPE\.GROUP\]\.includes\(conversationType\)/,
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
  /unreadCount > 0 &&\s*\[CONVERSATION_TYPE\.SINGLE, CONVERSATION_TYPE\.GROUP\]\.includes\(conversationType\)/,
  'Chatroom rows must not dispatch the SDK 5.0 unread-clear operation.',
);
assert.match(conversationList, /lastMessage\?\.sender\?\.userId/);
assert.match(conversationList, /lastMessage\?\.timestamp/);
assert.doesNotMatch(
  conversationList,
  /lastMessage\?\.(?:from|time)\b|const \{ type, msg \}|route\?\.query\?\.id\b/,
);
assert.match(coverage, /\| API 覆盖率 \| 93\.6% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 189 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 13 \|/);
assert.match(
  coverage,
  /\| 会话列表与筛选 \| `ChatManager\.getConversationList`, `refreshSessionList` \| 是 \| 会话列表、本地筛选、置顶会话筛选均调用 `getConversationList`；会话列表顶部提供主动刷新入口，调用 `refreshSessionList\(\{ includeEmpty: true \}\)` 后直接展示 SDK 返回的真实会话列表。 \| 真实刷新结果以 SDK \/ 服务端返回为准；失败不读取旧接口或用本地缓存伪造成刷新成功。 \|/,
);
assert.doesNotMatch(coverage, /未覆盖 `ChatManager\.refreshSessionList`/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 189 个，未覆盖 13 个；`@internal` 私有方法已剔除/,
);
assert.match(
  casesList,
  /主动刷新会话列表（调用 SDK 5\.0 `refreshSessionList\(\{ includeEmpty: true \}\)`，成功后直接展示 SDK 返回的真实会话列表；失败展示真实错误，不用本地缓存伪造刷新成功）/,
);
assert.match(
  superpowers,
  /会话列表主动刷新必须调用 SDK 5\.0 `refreshSessionList\(\{ includeEmpty: true \}\)` 并直接展示 SDK 返回的真实列表，失败保留真实错误，不读取旧接口或用本地缓存伪造成刷新成功/,
);

console.log('sdk5 conversation store contract: PASS');
