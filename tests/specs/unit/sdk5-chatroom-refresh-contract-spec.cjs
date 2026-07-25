const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const chatroomDetails = read('src/views/Chat/components/Chatroom/ChatroomDetails.vue');
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

assert.match(
  chatroomDetails,
  /const refreshChatroomDetails = async \(\) => \{[\s\S]*const res = await chatRoom\(\)\.refresh\(\);[\s\S]*chatroomDetails\.value = res;[\s\S]*return res;/,
  'Chatroom details must expose a real SDK 5.0 ChatRoom.refresh path and consume the raw returned detail.',
);
assert.match(
  chatroomDetails,
  /<el-button[\s\S]*@click="refreshChatroomDetails"[\s\S]*刷新聊天室详情[\s\S]*<\/el-button>/,
  'Chatroom details must provide a visible refresh button backed by ChatRoom.refresh.',
);
assert.match(
  chatroomDetails,
  /await chatRoom\(\)\.updateInfo\(editForm\.value\);[\s\S]*await refreshChatroomDetails\(\);/,
  'After updateInfo succeeds, the page must refresh with ChatRoom.refresh instead of using a getInfo-only path.',
);
assert.doesNotMatch(
  chatroomDetails,
  /(?:EMClient|conn\.|sdk4|v4|4\.24\.1|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:|adapter|兼容|兜底)/i,
  'Chatroom refresh implementation must not introduce SDK 4.0 fields, adapters, or fallback paths.',
);

assert.match(
  casesList,
  /刷新聊天室详情；调用 SDK 5\.0 `chatRoomManager\.getChatRoom\(chatRoomId\)\.refresh\(\)` 并展示 SDK 返回的真实 `ChatRoomDetail`/,
);
assert.match(
  superpowers,
  /聊天室基础资料刷新必须只调用 SDK 5\.0 公开 `chatRoomManager\.getChatRoom\(chatRoomId\)\.refresh\(\)`，并展示返回的真实 `ChatRoomDetail`/,
);
assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 193 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.match(
  coverage,
  /\| 聊天室基础资料 \| `ChatRoom\.getInfo`, `refresh`, `updateInfo`, `leaveChatRoom` \| 是 \| 聊天室详情、刷新聊天室详情、修改聊天室信息、退出聊天室均已通过公开 `ChatRoom\.getInfo` \/ `refresh` \/ `updateInfo` \/ `leaveChatRoom` 接入。 \| 真实权限和服务端结果以 SDK 返回为准；失败不本地回填。 \|/,
);
assert.doesNotMatch(coverage, /未覆盖 `ChatRoom\.refresh`/);
assert.doesNotMatch(uncovered, /ChatRoom\.refresh/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 193 个，未覆盖 12 个；`@internal` 私有方法已剔除/,
);

console.log('sdk5 chatroom refresh contract: PASS');
