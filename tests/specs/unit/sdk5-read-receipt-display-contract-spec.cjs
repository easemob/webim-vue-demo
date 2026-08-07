const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const textMessage = read(
  'src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue',
);
const messageItem = read(
  'src/views/Chat/components/Message/components/ChatMessageListItem/index.vue',
);
const readAckListener = read('src/IM/listener/imReadAckListener.js');
const messageStore = read('src/store/modules/message.js');
const messageView = read('src/views/Chat/components/Message/index.vue');

assert.doesNotMatch(
  textMessage,
  /needReadReceipt:\s*conversationType\.value\s*===\s*CONVERSATION_TYPE\.GROUP/,
  '单聊和群聊文本消息都必须请求 SDK 5.0 已读回执',
);
assert.match(
  textMessage,
  /needReadReceipt:\s*true/,
  '发送消息时必须显式请求 SDK 5.0 已读回执',
);
assert.match(
  textMessage,
  /conversationType\.value\s*!==\s*CONVERSATION_TYPE\.CHATROOM/,
  '聊天室不支持已读回执，不能把 needReadReceipt 传入聊天室发送请求',
);
assert.match(
  readAckListener,
  /groupReadCount:\s*count/,
  '群聊必须直接保存 SDK 回执的累计已读人数',
);
assert.match(
  messageItem,
  /msgBody\?\.groupReadCount\s*>\s*0/,
  '群聊只能根据 SDK 5.0 真实 groupReadCount 显示绿色已读图标',
);
assert.match(
  messageItem,
  /const isMyself\s*=\s*\(msgBody\)\s*=>\s*\{[\s\S]*msgBody\?\.direct === 'SEND'[\s\S]*msgBody\?\.direct === 'RECEIVE'[\s\S]*msgBody\.sender\?\.userId === loginUserId[\s\S]*\};/,
  '发送方 UI 判断必须优先使用 SDK 5.0 原始 direct 字段，避免 sender 缺失时隐藏送达/已读对勾',
);
assert.doesNotMatch(
  messageItem,
  /const isMyself\s*=\s*\(msgBody\)\s*=>\s*\{\s*return msgBody\.sender\?\.userId === loginUserId;\s*\};/,
  '不能只依赖 sender.userId 判断自己发送的消息。',
);
assert.match(
  messageItem,
  /const getSingleChatReceiptText\s*=\s*\(msgBody\)\s*=>\s*\{[\s\S]*msgBody\?\.conversationType\s*!==\s*CONVERSATION_TYPE\.SINGLE[\s\S]*msgBody\?\.isPeerRead\s*===\s*true[\s\S]*return '✓✓';[\s\S]*msgBody\?\.delivered\s*===\s*true[\s\S]*return '✓';/,
  '单聊回执必须只消费 SDK 5.0 delivered 与 isPeerRead，并将已读覆盖为第二个绿色对勾',
);
assert.match(
  messageItem,
  /v-if="isMyself\(msgBody\)\s*&&\s*getSingleChatReceiptText\(msgBody\)"[\s\S]*\{\{\s*getSingleChatReceiptText\(msgBody\)\s*\}\}/,
  '单聊发送方必须在同一状态槽展示送达一勾或已读两勾，接收方不展示回执图标',
);
assert.match(
  messageItem,
  /const getGroupChatReceiptText\s*=\s*\(msgBody\)\s*=>\s*\{[\s\S]*msgBody\?\.conversationType\s*!==\s*CONVERSATION_TYPE\.GROUP[\s\S]*msgBody\?\.groupReadCount\s*>\s*0[\s\S]*return '✓✓';[\s\S]*msgBody\?\.delivered\s*===\s*true[\s\S]*return '✓';/,
  '群聊回执必须只消费 SDK 5.0 delivered 与 groupReadCount，并将至少一人已读覆盖为第二个绿色对勾',
);
assert.match(
  messageItem,
  /v-if="isMyself\(msgBody\)\s*&&\s*getGroupChatReceiptText\(msgBody\)"[\s\S]*\{\{\s*getGroupChatReceiptText\(msgBody\)\s*\}\}/,
  '群聊发送方必须在同一状态槽展示送达一勾或群已读两勾，接收方不展示回执图标',
);
assert.doesNotMatch(
  messageStore,
  /messageIdsCollection|UPDATE_MESSAGE_IDS_COLLECTION/,
  '已读状态不能保留旧的本地 Map 映射',
);
assert.doesNotMatch(
  messageItem,
  /messageIdsCollection|currentMessageIds|msgBody\?\.read/,
  '消息 UI 不能读取旧 Map 或非 SDK 5.0 的 read 字段',
);
assert.doesNotMatch(
  readAckListener,
  /UPDATE_MESSAGE_IDS_COLLECTION/,
  '单聊已读回执必须直接更新 SDK 5.0 原始消息字段',
);
assert.match(
  messageStore,
  /message\.isPeerRead\s*=\s*true/,
  '单聊真实已读回执必须写入 SDK 5.0 isPeerRead',
);
assert.doesNotMatch(
  messageStore,
  /SEND_MESSAGE_READ_RECEIPT/,
  '已读回执不能保留未调用且带副作用的 mutation；必须由接收消息 action 直接调用 SDK 5.0',
);
assert.match(
  messageStore,
  /const receiptPayload\s*=\s*Array\.isArray\(payload\)[\s\S]*?const incomingMessages\s*=\s*Array\.isArray\(receiptPayload\.messages\)[\s\S]*?const \{ initialHistoryRender = false, readAt, unreadCount \} = receiptPayload;/s,
  '单聊已读回执 action 必须接收页面已展示的 SDK 5.0 原始消息和 readAt/unreadCount 日志上下文',
);
assert.match(
  messageStore,
  /message\?\.direct\s*===\s*'RECEIVE'/,
  '只有 SDK 5.0 原始接收方向的消息才能发送已读回执',
);
assert.match(
  messageStore,
  /message\?\.needReadReceipt\s*===\s*true/,
  '接收端只为 SDK 5.0 明确请求已读回执的消息发送回执',
);
assert.match(
  messageStore,
  /message\.msgServerId/,
  '已读回执必须使用 SDK 5.0 服务端消息 ID，不能使用本地 ID 兜底',
);
assert.doesNotMatch(
  messageStore,
  /getCurrentConversation\(\)|requiresActiveConversation|document\.visibilityState|sendMessageReadReceipts skipped/,
  '接收端不以当前会话、页面可见性或 skipped 作为本地跳过条件',
);
assert.match(
  messageStore,
  /message\.conversationType === CONVERSATION_TYPE\.SINGLE[\s\S]*message\.conversationType === CONVERSATION_TYPE\.GROUP/s,
  '只允许单聊和群聊发送已读回执；聊天室不调用 SDK 5.0 已读回执 API',
);
assert.match(
  messageStore,
  /sendMessageReadReceipts\(\{\s*conversationId,\s*conversationType,\s*messageIds,\s*\}\)/s,
  'SDK 5.0 已读回执请求只能传 conversationId、conversationType 和 messageIds',
);
assert.match(
  messageView,
  /const newlyDisplayedMessages\s*=\s*messageData\.value\.filter\([\s\S]*?store\.dispatch\('sendIncomingMessageReadReceipt', \{[\s\S]*?messages:\s*newlyDisplayedMessages,[\s\S]*?initialHistoryRender,[\s\S]*?readAt:\s*initialHistoryReadAt\.value,[\s\S]*?unreadCount:\s*initialHistoryUnreadCount\.value,/s,
  '单聊和群聊的 SDK 5.0 接收消息必须在页面渲染完成后，以新展示消息触发已读回执',
);
assert.match(
  messageStore,
  /const receiptMessages\s*=\s*receiptCandidates;/,
  '用户实际渲染的合格消息必须发送回执，不能由清未读后的 readAt 排除',
);
assert.doesNotMatch(
  messageStore,
  /\[Message Receipt\] (skip single-chat read receipt|send read receipt success)/,
  '已读回执正常路径不重复输出 Demo 日志，应直接使用 SDK 5.0 的内部日志',
);

console.log('sdk5 read-receipt display contract: PASS');
