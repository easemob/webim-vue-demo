const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const receiveListener = read('src/IM/listener/imReciveMessageListener.js');
const readAckListener = read('src/IM/listener/imReadAckListener.js');
const reactionListener = read('src/IM/listener/imReactionListener.js');
const multiDeviceListener = read('src/IM/listener/imMultiDeviceListener.js');
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

const listenerContracts = [
  {
    source: receiveListener,
    constant: 'CHAT_MESSAGE_LISTENER_ID',
    id: 'messageListen',
  },
  {
    source: readAckListener,
    constant: 'CHAT_READ_ACK_LISTENER_ID',
    id: 'aboutReadAckMessage',
  },
  {
    source: reactionListener,
    constant: 'CHAT_REACTION_LISTENER_ID',
    id: 'REACTION',
  },
  {
    source: multiDeviceListener,
    constant: 'CHAT_MULTI_DEVICE_LISTENER_ID',
    id: 'multiDeviceEvent',
  },
];

for (const { source, constant, id } of listenerContracts) {
  assert.match(
    source,
    new RegExp(`const ${constant} = '${id}';`),
    `Chat listener id ${id} must be an explicit SDK 5.0 handler id constant.`,
  );
  assert.match(
    source,
    new RegExp(
      `const manager = requireManager\\('chatManager'\\);[\\s\\S]*manager\\.removeEventHandler\\(${constant}\\);[\\s\\S]*manager\\.addEventHandler\\(\\s*${constant}\\s*,`,
    ),
    `Chat listener ${id} must call ChatManager.removeEventHandler with the same id before addEventHandler.`,
  );
  assert.doesNotMatch(
    source,
    /(?:EMClient|conn\.|onChatEvent|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:)/,
    `Chat listener ${id} must not restore SDK 4.0 event paths or fields.`,
  );
}

assert.match(
  casesList,
  /消息事件监听生命周期（登录初始化注册消息、撤回、编辑、回执、Reaction、多设备等 SDK 5\.0 Chat 事件前，先调用 `ChatManager\.removeEventHandler\(handlerId\)` 清理同 ID 监听，再调用 `addEventHandler\(handlerId, handlers\)` 注册；不使用旧事件聚合或本地兼容映射）/,
);
assert.match(
  superpowers,
  /消息事件监听生命周期必须使用 SDK 5\.0 `ChatManager\.addEventHandler\(handlerId, handlers\)` 与 `removeEventHandler\(handlerId\)` 成对处理；注册前先清理同 ID 监听，禁止恢复 SDK 4\.0 聚合事件、旧字段或重复监听兜底/,
);
assert.match(coverage, /\| API 覆盖率 \| 93\.6% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 189 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 13 \|/);
assert.match(
  coverage,
  /\| 消息事件监听 \| `ChatManager\.addEventHandler`, `ChatManager\.removeEventHandler` \| 是 \| 已监听消息、撤回、编辑、回执、Reaction、多设备等 Chat 事件并按 SDK 5\.0 字段入库 \/ 展示；每个 Chat 监听注册前都会先调用 `removeEventHandler\(handlerId\)` 清理同 ID 监听，再调用 `addEventHandler\(handlerId, handlers\)` 注册。 \| 真实事件下发与字段仍以 SDK \/ 服务端回调为准；不使用旧事件聚合、旧字段映射或重复监听兜底。 \|/,
);
assert.doesNotMatch(coverage, /未覆盖 `ChatManager\.removeEventHandler`/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 189 个，未覆盖 13 个；`@internal` 私有方法已剔除/,
);

console.log('sdk5 chat event lifecycle contract: PASS');
