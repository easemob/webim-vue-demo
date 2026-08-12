const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const messageItem = read(
  'src/views/Chat/components/Message/components/ChatMessageListItem/index.vue',
);
const messageStore = read('src/store/modules/message.js');
const multiDeviceListener = read('src/IM/listener/imMultiDeviceListener.js');
const casesList = read('cases_list.md');
const projectRules = read('.codex/prompts/superpowers.md');
const apiCoverage = read('docs/sdk5-api-coverage.md');

assert.match(
  messageItem,
  /const supportsRoamingMessageDelete = \(message\) =>/,
  '消息组件必须有独立的漫游删除入口条件。',
);
assert.match(
  messageItem,
  /conversationType === CONVERSATION_TYPE\.SINGLE[\s\S]*conversationType === CONVERSATION_TYPE\.GROUP/,
  '漫游消息删除入口只能支持 SDK 5.0 单聊和群聊。',
);
assert.match(
  messageItem,
  /!!message\?\.msgServerId/,
  '入口必须以真实 msgServerId 作为前置条件。',
);
assert.match(messageItem, /删除漫游消息/);
assert.match(
  messageItem,
  /v-if="supportsRoamingMessageDelete\(msgBody\)"/,
  '聊天室或没有 msgServerId 的消息不能展示入口。',
);
assert.match(
  messageItem,
  /store\.dispatch\('removeMessageRoaming', \{[\s\S]*?msgServerId: msgBody\.msgServerId,[\s\S]*?conversationId: msgBody\.conversationId,[\s\S]*?conversationType: msgBody\.conversationType,/,
  '组件必须把原始 msgServerId 交给专用 Vuex action。',
);
assert.doesNotMatch(
  messageItem,
  /deleteRoamingMessage[\s\S]{0,800}msgLocalId/,
  '漫游消息删除不得以 msgLocalId 兜底。',
);

assert.match(
  messageStore,
  /removeMessageRoaming:\s*\(\{ dispatch, commit \}, params\) =>/,
  'Store 必须暴露语义明确的漫游删除 action。',
);
assert.match(
  messageStore,
  /const \{ msgServerId, conversationId, conversationType \} = params;/,
);
assert.match(
  messageStore,
  /conversationType === CONVERSATION_TYPE\.SINGLE[\s\S]*conversationType === CONVERSATION_TYPE\.GROUP/,
  'Store 必须拒绝聊天室漫游删除。',
);
assert.match(
  messageStore,
  /messageIds:\s*\[msgServerId\]/,
  'SDK 请求的 messageIds 必须只使用 msgServerId。',
);
assert.match(
  messageStore,
  /removeHistoryMessages\(deleteOptions\)/,
  'Store 必须调用 SDK 5.0 ChatManager.removeHistoryMessages。',
);
assert.match(
  messageStore,
  /removeHistoryMessages\(deleteOptions\)[\s\S]*?\.then\([\s\S]*?commit\('CHANGE_MESSAGE_BODAY'/,
  '只能在 SDK resolve 后从当前消息列表移除该消息。',
);
assert.doesNotMatch(
  messageStore,
  /removeMessageRoaming[\s\S]{0,1600}msgLocalId/,
  'Store 漫游删除不得把本地 ID 传给 SDK。',
);

assert.match(
  multiDeviceListener,
  /onMultiDeviceMessageRemoved:\s*\(event\) =>/,
  '必须注册 SDK 5.0 命名的多端漫游删除回调。',
);
assert.match(
  multiDeviceListener,
  /eventName:\s*'onMultiDeviceMessageRemoved'/,
);
assert.match(multiDeviceListener, /messageIds: event\?\.messageIds/);
assert.match(multiDeviceListener, /beforeTimestamp: event\?\.beforeTimestamp/);
assert.match(multiDeviceListener, /deviceId: event\?\.deviceId/);
assert.match(
  multiDeviceListener,
  /const getMultiDeviceMessageRemovedDomain = \(conversationType\) =>/,
  '多端删除事件必须独立处理 SDK 原始 conversationType。',
);
assert.match(
  multiDeviceListener,
  /conversationType === CONVERSATION_TYPE\.SINGLE/,
  '单聊事件必须按原始 conversationType 分类。',
);
assert.match(
  multiDeviceListener,
  /conversationType === CONVERSATION_TYPE\.GROUP/,
  '群组事件必须按原始 conversationType 分类。',
);
assert.match(
  multiDeviceListener,
  /conversationType === CONVERSATION_TYPE\.CHATROOM/,
  'SDK 若实际下发聊天室 conversationType，必须保留其原始分类。',
);
assert.match(
  multiDeviceListener,
  /return 'connection';/,
  '缺少或未知 conversationType 时必须标记为非会话分类，不能猜成单聊。',
);
assert.doesNotMatch(
  multiDeviceListener,
  /event\?\.conversationType === 'groupChat' \? 'group' : 'singleChat'/,
  '缺失 conversationType 时不得默认归类为单聊。',
);
assert.match(
  multiDeviceListener,
  /const domain = getMultiDeviceMessageRemovedDomain\(\s*event\?\.conversationType,?\s*\);[\s\S]*?store\.dispatch\('recordSdkEvent', \{[\s\S]*?domain,[\s\S]*?eventName:\s*'onMultiDeviceMessageRemoved',[\s\S]*?payload:\s*event/,
  '多端回调必须把原始 SDK payload 写入事件中心。',
);

assert.match(casesList, /删除漫游消息/);
assert.match(projectRules, /删除漫游消息/);
assert.match(apiCoverage, /删除漫游消息/);

console.log('sdk5 roaming message delete contract: PASS');
