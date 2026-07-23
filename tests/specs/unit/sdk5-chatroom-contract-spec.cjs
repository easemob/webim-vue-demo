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
const store = read('src/store/index.js');
const logout = read('src/views/Chat/components/NavBar/components/Logout.vue');
const { normalizeChatroomMembers } = require(path.join(
  root,
  'src/utils/chatroomMembers.js',
));

assert.match(
  chatroomIndex,
  /const rooms = Array\.isArray\(res\.items\) \? res\.items : \[\];/,
  'SDK 5.0 getChatRoomList returns items, not the removed v4 chatRooms field.',
);
assert.match(chatroomIndex, /item\.chatRoomId/);
assert.match(chatroomIndex, /item\?\.memberCount/);
assert.match(
  store,
  /joinedChatroomIds: new Set\(\)/,
  'Joined rooms must be retained in application memory while switching main-navigation tabs.',
);
assert.match(
  chatroomIndex,
  /store\.commit\('SET_JOINED_CHATROOM_STATUS', \{ roomId, joined \}\);/,
  'A successful join must mark only that room as joined.',
);
assert.match(
  chatroomIndex,
  /store\.state\.joinedChatroomIds\.has\(key\)/,
  'The chatroom list must read joined state from application memory, not component-local state.',
);
assert.match(
  chatroomIndex,
  /v-if="isJoinedRoom\(item\.chatRoomId\)"/,
  'A room confirmed as joined must render an enter button instead of join.',
);
assert.doesNotMatch(chatroomIndex, /res\.chatRooms/);
assert.doesNotMatch(chatroomIndex, /detailRes/);
assert.doesNotMatch(chatroomIndex, /joinedChatroomList/);
assert.doesNotMatch(chatroomIndex, /getJoinedChatRooms/);
assert.match(logout, /CLEAR_JOINED_CHATROOM_IDS/);
assert.doesNotMatch(
  chatroomIndex,
  /rooms\.map\(async \(room\) =>[\s\S]*?getChatRoomInfo/,
  'SDK 5.0 has no public joined-chatroom-list API. Do not probe every public room detail to simulate one.',
);

const unsupported = read('docs/sdk5-unsupported-capabilities.md');
assert.match(unsupported, /查询已加入聊天室列表/);
assert.match(unsupported, /聊天室消息免打扰/);

assert.match(
  chatroomDetails,
  /detail\?\.permissionType != null && detail\.permissionType !== 'none'/,
  'SDK 5.0 exposes current membership on ChatRoomDetail.permissionType.',
);
assert.doesNotMatch(chatroomDetails, /getJoinedChatRooms/);
assert.doesNotMatch(
  chatroomDetails,
  /ConversationDndSwitch/,
  'SDK 5.0 has no chatroom conversation-silent-mode API, so the old DND switch must not remain.',
);

assert.match(
  memberManagement,
  /const blockParams = \{\s*chatRoomId: chatRoomId\.value,\s*userIds: \[trimmedUsername\]/s,
  'SDK 5.0 blockMembers requires userIds.',
);
assert.match(
  memberManagement,
  /const allowlistParams = \{\s*chatRoomId: chatRoomId\.value,\s*userIds: \[trimmedUsername\]/s,
  'SDK 5.0 addUsersToAllowlist requires userIds.',
);
assert.match(
  memberManagement,
  /const muteParams = \{\s*chatRoomId: chatRoomId\.value,\s*userIds: \[trimmedUsername\],\s*duration,/s,
  'SDK 5.0 muteMembers requires userIds and duration in seconds.',
);
assert.match(
  memberManagement,
  /const unmuteParams = \{\s*chatRoomId: chatRoomId\.value,\s*userIds: \[username\]/s,
  'SDK 5.0 unmuteMembers requires userIds.',
);
assert.match(
  memberManagement,
  /blocklist\.value = res\.map\(\(item\) => \(\{ userId: item\.user\.userId \}\)\)/,
  'SDK 5.0 blocklist returns entries directly, not a v4 data envelope.',
);
assert.match(
  memberManagement,
  /allowlist\.value = res\.map\(\(item\) => \(\{ userId: item\.user\.userId \}\)\)/,
  'SDK 5.0 allowlist returns entries directly, not a v4 data envelope.',
);
assert.match(
  memberManagement,
  /mutelist\.value = res\.map\(\(item\) => \(\{\s*userId: item\.user\.userId,\s*muteExpire: item\.muteExpire,/s,
  'SDK 5.0 mutelist returns user and muteExpire directly.',
);
assert.match(
  memberManagement,
  /admins\.value = res;/,
  'SDK 5.0 getAdminList returns UserInfo[] directly.',
);
assert.match(
  memberManagement,
  /const hasChatroomActionSucceeded = \(result, userId\) =>/,
  'Batch chatroom operations must inspect SDK 5.0 succeeded results before reporting success.',
);
assert.match(
  memberManagement,
  /if \(!confirmChatroomActionSucceeded\('添加到黑名单', result, trimmedUsername\)\)/,
  'Blocklist additions must not present unresolved SDK results as success.',
);
assert.match(
  memberManagement,
  /if \(!confirmChatroomActionSucceeded\('添加到白名单', result, trimmedUsername\)\)/,
  'Allowlist additions must not present unresolved SDK results as success.',
);
assert.doesNotMatch(memberManagement, /\bEMClient\b/);
assert.match(
  memberManagement,
  /getMemberList\(\{\s*chatRoomId: chatRoomId\.value,\s*cursor,\s*pageSize: 50,\s*\}\)/s,
  'SDK 5.0 chatroom member pages require pageSize, not the v4 limit parameter.',
);
assert.deepEqual(
  normalizeChatroomMembers([
    {
      user: { userId: 'tst08' },
      role: 'member',
    },
  ]),
  [
    {
      user: { userId: 'tst08' },
      userId: 'tst08',
      role: 'member',
    },
  ],
  'SDK 5.0 ChatRoomMemberEntry exposes the member id at user.userId.',
);

assert.match(
  chatroomDetails,
  /admins\.value = res;/,
  'The chatroom details permission state must consume SDK 5.0 getAdminList UserInfo[] directly.',
);
assert.match(
  chatroomDetails,
  /attributes\.value = res\.attributes;/,
  'SDK 5.0 getAttributes returns an attributes snapshot, not a v4 data envelope.',
);
assert.match(
  chatroomDetails,
  /const confirmChatRoomAttributeMutation = \(action, result, expectedKeys\) =>/,
  'Chatroom attribute writes must inspect SDK 5.0 appliedKeys before reporting success.',
);
assert.match(
  chatroomDetails,
  /if \(!confirmChatRoomAttributeMutation\('设置聊天室属性', res, \[params\.attributeKey\]\)\)/,
  'Single attribute writes must not claim success when the SDK did not apply the key.',
);
assert.match(
  chatroomDetails,
  /if \(!confirmChatRoomAttributeMutation\('批量设置聊天室属性', res, Object\.keys\(attributesObj\)\)\)/,
  'Batch attribute writes must not claim full success when the SDK did not apply every key.',
);

console.log('sdk5 chatroom contract: PASS');
