const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const messageStore = fs.readFileSync(
  path.join(root, 'src/store/modules/message.js'),
  'utf8',
);
const conversationList = fs.readFileSync(
  path.join(
    root,
    'src/views/Chat/components/Conversation/components/ConversationList.vue',
  ),
  'utf8',
);
const messageView = fs.readFileSync(
  path.join(root, 'src/views/Chat/components/Message/index.vue'),
  'utf8',
);

assert.match(
  conversationList,
  /const \{ conversationId, customField, conversationType, readAt, unreadCount \} = conversationItem;[\s\S]*?store\.dispatch\('setIncomingReadReceiptBoundary', \{[\s\S]*?readAt,[\s\S]*?unreadCount,[\s\S]*?\}\);[\s\S]*?emit\('toChatMessage', conversationId, conversationType\);[\s\S]*?store\.dispatch\('clearConversationUnreadCount', \{\s*conversationId,\s*conversationType,\s*\}\);/s,
  '接收方点击有效单聊或群聊会话时，必须先保留 SDK 5.0 原始 readAt/unreadCount，再清零会话未读数',
);
assert.match(
  messageStore,
  /const receiptCandidates\s*=\s*incomingMessages\.filter\([\s\S]*message\?\.direct\s*===\s*'RECEIVE'[\s\S]*message\?\.needReadReceipt\s*===\s*true[\s\S]*message\.msgServerId[\s\S]*message\.conversationType === CONVERSATION_TYPE\.SINGLE[\s\S]*message\.conversationType === CONVERSATION_TYPE\.GROUP[\s\S]*\);/,
  '消息已读回执只能发送给 SDK 5.0 原始接收方向、明确请求回执、带服务端消息 ID 的单聊/群聊消息',
);
assert.doesNotMatch(
  messageStore,
  /getCurrentConversation\(\)|document\.visibilityState|sendMessageReadReceipts skipped/,
  '已读回执不得以 SDK 当前会话、页面可见性或 skipped 作为 Demo 本地跳过条件。',
);
assert.doesNotMatch(
  messageStore,
  /clearConversationUnreadMessageCount/,
  '收到在线消息时不得自动清零；清零接口只能由接收方点击会话入口调用',
);
assert.doesNotMatch(
  messageStore,
  /dispatch\('sendIncomingMessageReadReceipt'/,
  'Store 入库或历史查询阶段不得在页面渲染前发送已读回执。',
);
assert.match(
  messageView,
  /const newlyDisplayedMessages\s*=\s*messageData\.value\.filter\([\s\S]*?store\.dispatch\('sendIncomingMessageReadReceipt',\s*\{[\s\S]*?messages:\s*newlyDisplayedMessages,[\s\S]*?initialHistoryRender,[\s\S]*?readAt:/s,
  '消息页必须仅把新完成渲染的 SDK 5.0 原始消息与初始历史标记传给已读回执 action。',
);
assert.match(
  messageStore,
  /const receiptMessages\s*=\s*receiptCandidates;/,
  '已实际渲染的合格消息必须发送已读回执，菜单清未读更新 readAt 不能把它排除。',
);
assert.doesNotMatch(
  messageStore,
  /message\.timestamp\s*>\s*readAt/,
  'readAt 只能作为真实上下文日志，不能作为已实际查看消息的回执跳过条件。',
);
assert.match(
  messageStore,
  /\[Demo -> SDK 5\.0 API\] ChatManager\.sendMessageReadReceipts request/,
  '接收端必须打印传给 SDK 5.0 已读回执 API 的真实请求，便于区分未触发与 SDK 失败。',
);
assert.match(
  messageStore,
  /\[Demo <- SDK 5\.0 API\] ChatManager\.sendMessageReadReceipts response/,
  '接收端必须打印 SDK 5.0 已读回执 API 的原始响应。',
);

console.log('sdk5 incoming read-state contract: PASS');
