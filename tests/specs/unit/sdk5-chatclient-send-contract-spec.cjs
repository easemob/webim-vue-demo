const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const chat = read('src/IM/sdk5/chat.js');
const textMessage = read(
  'src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue',
);
const coverage = read('docs/sdk5-api-coverage.md');
const casesList = read('cases_list.md');
const projectRules = read('.codex/prompts/superpowers.md');

assert.match(chat, /const \{ requireManager, getClient \} = require\('\.\/client'\)/);
assert.match(
  chat,
  /async function sendMessageByClient\(message, options = \{\}\) \{\s*return getClient\(\)\.sendMessage\(message, options\);\s*\}/s,
);
const clientSendFunction =
  chat.match(/async function sendMessageByClient[\s\S]*?\n\}/)?.[0] || '';
assert.doesNotMatch(
  clientSendFunction,
  /chatManager|requireManager\('chatManager'\)\.sendMessage/,
);
assert.match(
  chat,
  /module\.exports = \{[\s\S]*createMessage,[\s\S]*sendMessage,[\s\S]*sendMessageByClient,[\s\S]*\};/,
);

assert.match(
  textMessage,
  /import \{ createMessage, sendMessage, sendMessageByClient \} from '@\/IM\/sdk5\/chat';/,
);
assert.match(textMessage, /const sendTextMessageByClient = _\.debounce\(/);
assert.match(textMessage, /await sendMessageByClient\(messageToSend, \{/);
const clientTextSendFunction =
  textMessage.match(/const sendTextMessageByClient[\s\S]*?\}, 50\);/)?.[0] || '';
assert.doesNotMatch(clientTextSendFunction, /await sendMessage\(/);
assert.match(
  textMessage,
  /@click="sendTextMessageByClient">\s*SDK5 Client\.sendMessage<\/el-button\s*>/,
);
assert.match(
  textMessage,
  /\[Message Send\] ChatClient\.sendMessage success/,
);
assert.match(
  textMessage,
  /\[Message Send\] ChatClient\.sendMessage failed/,
);

assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 193 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.match(
  coverage,
  /`@internal` 私有入口不进入覆盖率分母、不作为未覆盖能力/,
);
assert.doesNotMatch(coverage, /## `@internal` 转发入口使用情况/);
assert.match(
  coverage,
  /\| ChatClient 直接发消息 \| `ChatClient\.sendMessage` \| 是 \|/,
);
assert.match(casesList, /SDK5 Client\.sendMessage/);
assert.match(projectRules, /getClient\(\)\.sendMessage/);
assert.match(projectRules, /`ChatClient\.sendMessage` 失败后不得回退/);
assert.match(
  coverage,
  /\| 消息话题实体 API \| `ChatThread\.getInfo`, `refresh`, `join`, `leave`, `destroy`, `updateName`, `getMemberList`, `removeMember` \| 是 \|/,
);

console.log('sdk5 ChatClient.sendMessage contract: PASS');
