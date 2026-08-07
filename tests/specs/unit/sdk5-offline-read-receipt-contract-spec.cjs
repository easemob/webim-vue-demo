const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const connectListener = read('src/IM/listener/imConnectListener.js');
const receiveListener = read('src/IM/listener/imReciveMessageListener.js');
const messageStore = read('src/store/modules/message.js');
const messageView = read('src/views/Chat/components/Message/index.vue');
const messageItem = read(
  'src/views/Chat/components/Message/components/ChatMessageListItem/index.vue',
);
const eventCenter = read('src/views/Chat/components/InformDetails/index.vue');
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');

assert.match(
  connectListener,
  /const recordConnectionSdkEvent = \(eventName, payload\) => \{[\s\S]*domain: 'connection',[\s\S]*currentUserId: getCurrentUserId\(\),[\s\S]*\};/,
  '离线同步 Client 事件必须以独立 connection domain 保留真实事件名、payload 和当前账号。',
);
assert.match(
  connectListener,
  /onOfflineMessageSyncStart: \(\) => \{[\s\S]*recordConnectionSdkEvent\('onOfflineMessageSyncStart'\)[\s\S]*ChatClient\.onOfflineMessageSyncStart/s,
  '必须直接注册并记录 SDK 5.0 onOfflineMessageSyncStart。',
);
assert.match(
  connectListener,
  /onOfflineMessageSyncFinish: \(\) => \{[\s\S]*recordConnectionSdkEvent\('onOfflineMessageSyncFinish'\)[\s\S]*ChatClient\.onOfflineMessageSyncFinish/s,
  '必须直接注册并记录 SDK 5.0 onOfflineMessageSyncFinish。',
);
assert.match(
  eventCenter,
  /\{ value: 'connection', label: '连接事件' \}/,
  '事件中心必须提供真实 Client 连接事件筛选。',
);
assert.match(
  eventCenter,
  /const formatEventPayload = \(payload\) =>[\s\S]*payload === undefined[\s\S]*SDK 未下发 payload/s,
  'SDK 无 payload 的连接事件必须如实显示字段缺失，不能伪造空对象。',
);
assert.match(
  receiveListener,
  /\[IM Message\] SDK 收到消息[\s\S]*isOnline: message\.isOnline/s,
  '接收消息日志必须直接输出 SDK 5.0 原始 isOnline 字段。',
);
assert.match(
  messageItem,
  /v-if="msgBody\?\.isOnline === false"[\s\S]*SDK 离线同步消息/s,
  '页面仅在 SDK 明确下发 isOnline === false 时显示离线同步消息标签。',
);
assert.doesNotMatch(
  messageItem,
  /isOnline\s*===\s*undefined[\s\S]{0,160}离线同步消息/s,
  '不得把缺失 isOnline 字段推断为离线同步消息。',
);
assert.match(
  messageView,
  /const newlyDisplayedMessages\s*=\s*messageData\.value\.filter\([\s\S]*store\.dispatch\('sendIncomingMessageReadReceipt',[\s\S]*messages:\s*newlyDisplayedMessages/s,
  '离线消息也必须在实际渲染后沿用唯一的 SDK 5.0 Read ACK 入口。',
);
assert.match(
  messageStore,
  /message\?\.direct\s*===\s*'RECEIVE'[\s\S]*message\?\.needReadReceipt\s*===\s*true[\s\S]*message\.msgServerId[\s\S]*message\.conversationType === CONVERSATION_TYPE\.SINGLE[\s\S]*message\.conversationType === CONVERSATION_TYPE\.GROUP/s,
  'Read ACK 必须继续只允许真实可回执的单聊/群聊接收消息。',
);
assert.doesNotMatch(
  messageStore,
  /isOnline\s*!==\s*false|offline[\s\S]{0,80}(?:skip|ignore)[\s\S]{0,80}read/i,
  '不得因消息来源于离线同步而跳过真实 Read ACK。',
);
assert.doesNotMatch(
  `${connectListener}\n${receiveListener}\n${messageStore}\n${messageItem}`,
  /simulateOffline|mockOffline|forceOffline|offlineReadAckSuccess/i,
  'Demo 不得加入模拟离线或伪造离线 Read ACK 成功的路径。',
);
assert.match(
  casesList,
  /离线同步事件 `onOfflineMessageSyncStart`、`onOfflineMessageSyncFinish`[\s\S]*`isOnline === false`[\s\S]*页面实际渲染后[\s\S]*sendMessageReadReceipts/s,
  '能力清单必须说明离线同步与 Read ACK 都以 SDK 5.0 的真实事件和字段为准。',
);
assert.doesNotMatch(
  casesList,
  /接收端只在 SDK 5\.0 `getCurrentConversation\(\)` 返回相同 `conversationId`、`conversationType` 且浏览器页面可见时/,
  '能力清单不得保留已废弃的当前会话/页面可见性 Read ACK 条件。',
);
assert.match(
  superpowers,
  /`(?:ChatClient\.)?onOfflineMessageSyncStart`、`onOfflineMessageSyncFinish`[\s\S]*`isOnline === false`[\s\S]*不伪造离线标签、事件或 Read ACK 成功/s,
  '项目约束必须记录离线同步事件、原始字段和禁止伪造的边界。',
);
assert.doesNotMatch(
  superpowers,
  /接收端仅在 SDK 5\.0 `ChatManager\.getCurrentConversation\(\)` 返回与消息相同的 `conversationId`、`conversationType`，且浏览器页面可见时/,
  '项目约束不得保留当前会话/页面可见性 Read ACK 条件。',
);

console.log('sdk5 offline read-ack real-scenario contract: PASS');
