const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const chatroomIndex = read('src/views/Chat/components/Chatroom/index.vue');
const chatroomDetails = read('src/views/Chat/components/Chatroom/ChatroomDetails.vue');
const memberManagement = read(
  'src/views/Chat/components/Chatroom/ChatroomMemberManagement.vue',
);
const directedMessage = read(
  'src/views/Chat/components/Message/components/ChatInputBox/components/DirectedMessage/SendDirectedMessage.vue',
);
const directedDefaults = read('src/utils/directedMessageDefaults.js');
const threadDrawer = read(
  'src/views/Chat/components/Message/components/MessageThreadListDrawer.vue',
);
const mentionCheck = read('src/utils/handleSomeData/checkLastMsgIsHasMention.js');
const messageConstants = read('src/constant/messageType.js');
const messageSearchDrawer = read(
  'src/views/Chat/components/Message/components/MessageSearchDrawer.vue',
);
const migrationCheck = read('scripts/sdk5-migration-check.cjs');
const store = read('src/store/index.js');

assert.equal(
  fs.existsSync(path.join(root, 'src/utils/chatroomMembers.js')),
  false,
  'SDK 5.0 ChatRoomMemberEntry must not be translated to a top-level userId model.',
);
assert.doesNotMatch(memberManagement, /normalizeChatroomMembers|member\.userId/);
assert.match(memberManagement, /member\.user\.userId === getCurrentUserId\(\)/);
assert.match(memberManagement, /allMembers\.push\(\.\.\.res\.items\);/);
assert.match(memberManagement, /blocklist\.value = res;/);
assert.match(memberManagement, /allowlist\.value = res;/);
assert.match(memberManagement, /mutelist\.value = res;/);
assert.doesNotMatch(memberManagement, /(?:blocklist|allowlist|mutelist)\.value = res\.map/);
assert.doesNotMatch(memberManagement, /type:\s*'single'|row\.type/);
assert.match(memberManagement, /prop="user\.userId"/);
assert.match(memberManagement, /row\.user\.userId/);
assert.doesNotMatch(directedMessage, /normalizeChatroomMembers/);
assert.match(directedMessage, /allMembers\.push\(\.\.\.res\.items\);/);
assert.match(directedDefaults, /member\.user\?\.userId/);
assert.doesNotMatch(directedDefaults, /member\.userId/);

assert.doesNotMatch(
  threadDrawer,
  /normalizeThread(?:Detail|Members|List|LatestMessage)Response/,
  'The thread drawer must consume the SDK 5.0 response directly.',
);
assert.match(threadDrawer, /threads\.value = loadMore \? \[\.\.\.threads\.value, \.\.\.response\.items\] : response\.items;/);
assert.match(threadDrawer, /cursor\.value = response\.cursor;/);
assert.match(threadDrawer, /threadDetail\.value = response;/);
assert.match(threadDrawer, /threadMembers\.value = loadMore[\s\S]*?\.\.\.response\.items/s);
assert.doesNotMatch(threadDrawer, /\b(?:MESSAGE_TYPE|SESSION_MESSAGE_TYPE)\b/);
assert.match(threadDrawer, /case 'image':/);
assert.match(threadDrawer, /case 'voice':/);
assert.match(threadDrawer, /case 'location':/);
assert.doesNotMatch(threadDrawer, /case '(?:txt|img|audio|loc)':/);
assert.match(mentionCheck, /type === 'text'/);
assert.doesNotMatch(mentionCheck, /\bMESSAGE_TYPE\b/);
assert.doesNotMatch(mentionCheck, /type === 'txt'/);
assert.doesNotMatch(
  messageConstants,
  /\b(?:ALL_MESSAGE_TYPE|CUSTOM_MESSAGE_TYPE|MESSAGE_STATUS)\b/,
  'Unused V4 message-type/status aliases must not remain in the SDK 5.0-only constants module.',
);
assert.match(messageSearchDrawer, /\{ label: '文本 txt', value: 'txt' \}/);
assert.match(messageSearchDrawer, /\{ label: '图片 img', value: 'img' \}/);
assert.match(messageSearchDrawer, /\{ label: '位置 loc', value: 'loc' \}/);
for (const forbiddenSdk4Identifier of [
  'sdk4',
  'v4',
  'legacy',
  'messageAdapter',
  'sdk4Adapter',
  'MESSAGE_TYPE',
  'SESSION_MESSAGE_TYPE',
  'roomId',
  'normalizeChatroomMembers',
  'normalizeThread',
]) {
  assert.match(
    migrationCheck,
    new RegExp(forbiddenSdk4Identifier),
    `The migration guard must scan the runtime source for ${forbiddenSdk4Identifier}.`,
  );
}

for (const source of [chatroomIndex, chatroomDetails, memberManagement, store]) {
  assert.doesNotMatch(
    source,
    /\broomId\b/,
    'Chatroom routes and local state must use the SDK 5.0 name chatRoomId without a roomId compatibility alias.',
  );
}

console.log('sdk5 native data model contract: PASS');
