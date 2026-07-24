const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const sdk5Chat = read('src/IM/sdk5/chat.js');
const messageView = read('src/views/Chat/components/Message/index.vue');
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

assert.match(
  sdk5Chat,
  /function setCurrentConversation\(params\) \{[\s\S]*requireManager\('chatManager'\)\.setCurrentConversation\(\{[\s\S]*conversationId: params\.conversationId,[\s\S]*conversationType: params\.conversationType,[\s\S]*\}\);[\s\S]*\}/,
  'sdk5 chat wrapper must call ChatManager.setCurrentConversation with SDK 5.0 conversationId/conversationType',
);
assert.match(
  sdk5Chat,
  /function resetCurrentConversation\(\) \{[\s\S]*requireManager\('chatManager'\)\.resetCurrentConversation\(\);[\s\S]*\}/,
  'sdk5 chat wrapper must expose ChatManager.resetCurrentConversation',
);
assert.match(
  sdk5Chat,
  /function getCurrentConversation\(\) \{[\s\S]*return requireManager\('chatManager'\)\.getCurrentConversation\(\);[\s\S]*\}/,
  'sdk5 chat wrapper must expose ChatManager.getCurrentConversation',
);
assert.match(
  sdk5Chat,
  /module\.exports = \{[\s\S]*setCurrentConversation,[\s\S]*resetCurrentConversation,[\s\S]*getCurrentConversation,[\s\S]*\}/,
  'sdk5 chat wrapper must export all current conversation APIs',
);

assert.match(
  messageView,
  /import \{[\s\S]*setCurrentConversation,[\s\S]*resetCurrentConversation,[\s\S]*getCurrentConversation as getSdkCurrentConversation[\s\S]*\} from '@\/IM\/sdk5\/chat';/,
  'message page must import SDK 5.0 current conversation APIs directly',
);
assert.match(
  messageView,
  /const sdkCurrentConversation = ref\(null\);/,
  'message page must store the raw SDK getCurrentConversation result for display',
);
assert.match(
  messageView,
  /setCurrentConversation\(params\);[\s\S]*readSdkCurrentConversation\('set-current-conversation'\);/,
  'message page must set then read current conversation through SDK APIs',
);
assert.match(
  messageView,
  /resetCurrentConversation\(\);[\s\S]*readSdkCurrentConversation\('reset-current-conversation'\);/,
  'message page must reset then read SDK current conversation when closing or clearing context',
);
assert.match(
  messageView,
  /const readSdkCurrentConversation = \(context\) => \{[\s\S]*const current = getSdkCurrentConversation\(\);[\s\S]*sdkCurrentConversation\.value = current;/,
  'The current-conversation reader must store the raw SDK result without a local model conversion.',
);
assert.match(
  messageView,
  /onBeforeRouteLeave\(\(\) => \{[\s\S]*clearSdkCurrentConversation\('route-leave'\);[\s\S]*stopWatchRoute\(\);[\s\S]*\}\);/,
  'message page must reset SDK current conversation when leaving the message route',
);
assert.match(
  messageView,
  /class="sdk_current_conversation_context"/,
  'message page must visibly expose the SDK current conversation result',
);
assert.doesNotMatch(
  messageView,
  /(?:id|chatType|to|from):\s*(?:conversationId|conversationType|routeQueryData)/,
  'current conversation coverage must not introduce V4-shaped route/message field aliases',
);

assert.match(
  casesList,
  /SDK 当前会话上下文（进入消息页调用 `setCurrentConversation\(\{ conversationId, conversationType \}\)`，页面展示 `getCurrentConversation\(\)` 真实返回，切换或离开消息页调用 `resetCurrentConversation\(\)`；用于验证当前会话在线消息不累加 SDK 本地未读，不做本地兜底）/,
  'cases_list.md must document the SDK current conversation coverage',
);
assert.match(
  superpowers,
  /进入消息页必须调用 SDK 5\.0 `setCurrentConversation\(\{ conversationId, conversationType \}\)`，展示 `getCurrentConversation\(\)` 真实返回，切换或离开消息页必须调用 `resetCurrentConversation\(\)`/,
  'superpowers must record the current conversation rule',
);
assert.match(
  coverage,
  /\| API 覆盖率 \| 93\.6% \| 按当前 `src\/` 已直接调用的公开对外 API 去重数量统计，`189 \/ 202` \|/,
  'coverage summary must include the 3 newly covered current conversation APIs',
);
assert.match(
  coverage,
  /\| 当前会话上下文 \| `ChatManager\.setCurrentConversation`, `resetCurrentConversation`, `getCurrentConversation` \| 是 \| 进入消息页调用 `setCurrentConversation\(\{ conversationId, conversationType \}\)`，页面展示 `getCurrentConversation\(\)` 的 SDK 真实返回，切换会话或离开消息页调用 `resetCurrentConversation\(\)`。 \| 用于验证 SDK 当前会话收到在线消息时不累加本地未读；真实效果仍需用单聊、群聊、聊天室在线消息分别验收并保留 console 证据。 \|/,
  'coverage matrix must mark current conversation context as covered',
);
assert.doesNotMatch(
  coverage,
  /未覆盖 `ChatManager\.setCurrentConversation` \/ `resetCurrentConversation` \/ `getCurrentConversation`/,
  'coverage gap summary must remove current conversation APIs',
);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 189 个，未覆盖 13 个；`@internal` 私有方法已剔除/,
  'uncovered capabilities summary must use the updated public API counts',
);

console.log('sdk5 current conversation context contract: PASS');
