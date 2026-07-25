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

assert.match(
  chatroomIndex,
  /const rooms = Array\.isArray\(res\.items\) \? res\.items : \[\];/,
  'SDK 5.0 getChatRoomList returns items, not the removed v4 chatRooms field.',
);
assert.match(chatroomIndex, /item\.chatRoomId/);
assert.match(chatroomIndex, /item\?\.memberCount/);
assert.match(
  chatroomIndex,
  /<div class="desc">聊天室ID：\{\{ item\.chatRoomId \}\}<\/div>/,
  'Chatroom summaries must display the native SDK 5.0 chatRoomId instead of a placeholder description.',
);
assert.doesNotMatch(chatroomIndex, /SDK 5\.0 列表未返回聊天室描述/);
assert.match(
  chatroomIndex,
  /const getChatrooms = async \(\) => \{[\s\S]*?\} catch \(error\) \{[\s\S]*?console\.error\([\s\S]*?if \(isImAuthFailedReason\(error\)\) \{[\s\S]*?redirectToLoginClearImSession\(\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?ElMessage\.error\(getSdk5ErrorMessage\(error, '获取聊天室列表失败'\)\);/,
  'A real SDK 5.0 authentication failure while loading chatrooms must clear the expired IM session and return to login without retrying or fabricating a list.',
);
assert.match(
  store,
  /joinedChatroomIds: new Set\(\)/,
  'Joined rooms must be retained in application memory while switching main-navigation tabs.',
);
assert.match(
  chatroomIndex,
  /store\.commit\('SET_JOINED_CHATROOM_STATUS', \{ chatRoomId, joined \}\);/,
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

const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
assert.match(
  casesList,
  /刷新聊天室列表失败时保留 SDK \/ 服务端真实错误；若 SDK 5\.0 返回 token 失效、未登录或未授权则清除过期登录态并回到登录页，不重试、不伪造列表/,
);
assert.match(
  casesList,
  /列表直接展示 SDK 5\.0 `ChatRoomSummary\.chatRoomId`，不展示固定“未返回描述”文案，也不为描述额外请求详情/,
);
assert.match(
  superpowers,
  /聊天室公开列表调用失败必须保留 SDK \/ 服务端真实错误；仅 token 失效、未登录或未授权才清除过期登录态并回到登录页，权限拒绝（`210`）以及 SDK 映射为 `202` 但 `details\.reason` 明确为黑名单的业务拒绝必须留在当前页展示原始错误，不重试、不伪造列表/,
);
assert.match(
  superpowers,
  /聊天室列表直接展示 SDK 5\.0 `ChatRoomSummary\.chatRoomId`；不得展示固定描述占位文案，也不得为列表描述额外请求详情/,
);
assert.match(
  casesList,
  /查询当前用户聊天室禁言状态；调用 SDK 5\.0 `chatRoomManager\.getChatRoom\(chatRoomId\)\.checkIfInMuteList\(\)` 并展示真实 `ChatRoomMuteStatus\.muted` 与 `muteExpireAt`；失败展示真实错误，不显示为“未禁言”/,
);
assert.match(
  superpowers,
  /聊天室当前用户禁言状态必须只调用 SDK 5\.0 `chatRoomManager\.getChatRoom\(chatRoomId\)\.checkIfInMuteList\(\)`，展示真实 `ChatRoomMuteStatus\.muted` 和 `muteExpireAt`；查询失败要展示原始错误，禁止把失败或未查询状态显示成“未禁言”/,
);

assert.match(
  chatroomDetails,
  /const isCurrentUserJoined = computed\(\(\) => \{[\s\S]*?const chatRoomId = normalizeChatroomId\(route\.query\.chatRoomId\);[\s\S]*?store\.state\.joinedChatroomIds\.has\(chatRoomId\)/,
  'Only a successful SDK 5.0 joinChatRoom call may enable chatroom member actions; owner permissionType is not membership.',
);
assert.doesNotMatch(
  chatroomDetails,
  /detail\?\.permissionType != null && detail\.permissionType !== 'none'/,
  'ChatRoomDetail.permissionType is an authorization field and must not be used as a joined-membership substitute.',
);
assert.doesNotMatch(chatroomDetails, /getJoinedChatRooms/);
assert.doesNotMatch(
  chatroomDetails,
  /ConversationDndSwitch/,
  'SDK 5.0 has no chatroom conversation-silent-mode API, so the old DND switch must not remain.',
);
assert.match(
  chatroomDetails,
  /const editForm = ref\(\{\s*name: '',\s*description: '',\s*maxMembers: 200,\s*\}\);/s,
  'The chatroom edit form must store the public SDK 5.0 updateInfo field names directly.',
);
assert.match(
  chatroomDetails,
  /await chatRoom\(\)\.updateInfo\(editForm\.value\);/,
  'The chatroom edit form must pass native SDK 5.0 updateInfo params without a local mapping object.',
);
assert.doesNotMatch(
  chatroomDetails,
  /\b(?:chatRoomName|maxusers)\b|const options = \{/,
  'The chatroom edit flow must not retain a V4-shaped form model or parameter adapter.',
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
  /const selfMuteStatus = ref\(null\);/,
  'Current-user chatroom mute state must keep the raw SDK 5.0 ChatRoomMuteStatus object.',
);
assert.match(
  memberManagement,
  /const selfMuteStatusError = ref\(null\);/,
  'Current-user chatroom mute-state failures must be represented separately from muted:false.',
);
assert.match(
  memberManagement,
  /const isSelfInMutelist = computed\(\(\) => selfMuteStatus\.value\?\.muted === true\);/,
  'The current-user mute banner must read ChatRoomMuteStatus.muted directly.',
);
assert.match(
  memberManagement,
  /const muteStatus = await chatRoom\(\)\.checkIfInMuteList\(\);[\s\S]*selfMuteStatus\.value = muteStatus;[\s\S]*selfMuteStatusError\.value = null;/,
  'checkIfInMuteList must store the SDK 5.0 raw mute status on success.',
);
assert.match(
  memberManagement,
  /console\.log\('\[SDK 5\.0 ChatRoom\] checkIfInMuteList success'[\s\S]*muteStatus/,
  'The Demo must log the real checkIfInMuteList response for SDK/server inconsistency checks.',
);
assert.doesNotMatch(
  memberManagement,
  /catch \(error\) \{[\s\S]*isSelfInMutelist\.value = false;[\s\S]*\}/,
  'A failed checkIfInMuteList request must not be displayed as muted:false.',
);
assert.match(
  memberManagement,
  /selfMuteStatusError\.value = error;/,
  'A failed checkIfInMuteList request must surface the raw SDK/server error.',
);
assert.match(
  memberManagement,
  /v-if="!hasAdminPermission && selfMuteStatusError"/,
  'Non-admin mute-state failures must be visible instead of saying not muted.',
);
assert.match(
  memberManagement,
  /v-else-if="!hasAdminPermission && selfMuteStatus"/,
  'Non-admin current-user mute status must only be displayed after a real SDK response.',
);
assert.match(
  memberManagement,
  /v-else-if="hasAdminPermission && mutelist\.length === 0"/,
  'Only users with permission to fetch the mute list may see the empty mute-list banner.',
);
assert.match(
  memberManagement,
  /<el-table[\s\S]*v-if="hasAdminPermission"[\s\S]*:data="mutelist"/,
  'Non-admin users must not see an empty table for an unqueried administrator-only mute list.',
);
assert.match(
  memberManagement,
  /const unmuteParams = \{\s*chatRoomId: chatRoomId\.value,\s*userIds: \[username\]/s,
  'SDK 5.0 unmuteMembers requires userIds.',
);
assert.match(memberManagement, /blocklist\.value = res;/);
assert.match(memberManagement, /allowlist\.value = res;/);
assert.match(memberManagement, /mutelist\.value = res;/);
assert.doesNotMatch(
  memberManagement,
  /(?:blocklist|allowlist|mutelist)\.value = res\.map/,
  'Chatroom lists must retain SDK 5.0 entry objects instead of constructing a V4-shaped userId record.',
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
  /const chatRoom = \(\) => chatRoomManager\(\)\.getChatRoom\(chatRoomId\.value\);/,
  'Chatroom member management must enter single-room operations through the SDK 5.0 ChatRoom facade.',
);
assert.match(
  memberManagement,
  /chatRoom\(\)\.getMembers\(\{\s*cursor,\s*pageSize: 50,\s*\}\)/s,
  'SDK 5.0 ChatRoom.getMembers pages require pageSize and the facade-bound room id, not a v4 limit parameter or manager-level chatRoomId call.',
);
assert.equal(
  fs.existsSync(path.join(root, 'src/utils/chatroomMembers.js')),
  false,
  'The V4-shaped chatroom-member adapter must be removed; SDK 5.0 exposes the ID at entry.user.userId.',
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
