const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const chat = read('src/IM/sdk5/chat.js');
const callMessages = read('src/components/EaseCallKit/utils/callMessages.js');
const textMessage = read(
  'src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue',
);

for (const type of [
  'text',
  'image',
  'file',
  'voice',
  'video',
  'location',
  'cmd',
  'custom',
  'combine',
]) {
  assert.match(
    chat,
    new RegExp(`${type}: 'create[A-Z][A-Za-z]+Message'`),
    `SDK 5.0 ${type} 消息必须通过统一创建入口处理已读回执参数`,
  );
}

assert.match(
  chat,
  /function withNeedReadReceipt\(params\) \{[\s\S]*params\?\.conversationType === CONVERSATION_TYPE\.SINGLE[\s\S]*params\?\.conversationType === CONVERSATION_TYPE\.GROUP[\s\S]*needReadReceipt: true[\s\S]*\}/,
  'SDK 5.0 创建单聊和群聊消息时必须请求已读回执',
);
assert.match(
  chat,
  /return requireManager\('chatManager'\)\[builder\]\(\{\s*\.\.\.withNeedReadReceipt\(params\),/s,
  '所有通过 SDK 5.0 公共创建入口发送的消息都必须经过已读回执参数处理',
);
assert.match(
  chat,
  /conversationType === CONVERSATION_TYPE\.SINGLE \|\|\s*params\?\.conversationType === CONVERSATION_TYPE\.GROUP/,
  '只有 SDK 5.0 支持已读回执的单聊和群聊携带 needReadReceipt，聊天室不得携带该字段',
);
assert.match(
  chat,
  /if \(!supportsReadReceipt\) \{\s*delete messageParams\.needReadReceipt;\s*return messageParams;\s*\}/s,
  '聊天室消息必须移除 needReadReceipt，不能把不支持的字段传入 SDK 5.0 创建参数',
);
assert.match(
  callMessages,
  /createTextMessage\(\{[\s\S]*conversationType: 'singleChat',[\s\S]*needReadReceipt: true,/,
  'EaseCallKit 的 SDK 5.0 单聊文本消息也必须请求已读回执',
);
assert.match(
  callMessages,
  /createCmdMessage\(\{[\s\S]*conversationType: 'singleChat',[\s\S]*needReadReceipt: true,/,
  'EaseCallKit 的 SDK 5.0 单聊 CMD 消息也必须请求已读回执',
);
for (const sendMethod of ['sendMessage', 'sendMessageByClient']) {
  const options =
    textMessage.match(
      new RegExp(`\\b${sendMethod}\\(messageToSend, \\{([\\s\\S]*?)\\}\\);`),
    )?.[1] || '';
  assert.doesNotMatch(
    options,
    /needReadReceipt/,
    `${sendMethod} 的 SDK 5.0 SendMessageOptions 不支持 needReadReceipt，字段只能在创建消息时传入`,
  );
}

console.log('sdk5 message read-receipt create contract: PASS');
