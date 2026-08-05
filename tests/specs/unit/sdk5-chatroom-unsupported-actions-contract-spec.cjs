const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const details = read('src/views/Chat/components/Chatroom/ChatroomDetails.vue');
const unsupported = read('docs/sdk5-unsupported-capabilities.md');

assert.doesNotMatch(
  details,
  /destroyChatroom|destroyChatRoom|解散聊天室/,
  'SDK 5.0 does not expose a chatroom-destroy API, so the Demo must not retain an action entry.',
);
assert.match(
  unsupported,
  /\| 解散聊天室 \| Demo 无入口 \| \x60ChatRoomManager\x60 公开 API 不含 \x60destroyChatRoom\x60 \| Demo 不提供入口，不调用私有 API、REST 或本地模拟 \| 已确认不支持 \|/,
);

console.log('sdk5 chatroom unsupported actions contract: PASS');
