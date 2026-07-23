const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/groups.js'),
  'utf8',
);
const groupAdapter = fs.readFileSync(
  path.resolve(__dirname, '../../../src/utils/groupDocAdapters.js'),
  'utf8',
);
const createGroups = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/NavBar/components/ApplyComponents/createGroups.vue',
  ),
  'utf8',
);
const groupDetails = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/AboutGroups/GroupsDetails/index.vue',
  ),
  'utf8',
);
const joinedGroups = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Contacts/components/JoinedGroupsItem.vue',
  ),
  'utf8',
);
const groupMembers = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/AboutGroups/GroupsManagement/GroupMembers.vue',
  ),
  'utf8',
);
const groupMuteList = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/AboutGroups/GroupsManagement/GroupMuteList.vue',
  ),
  'utf8',
);
const groupHeader = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Message/components/ChatContainerHeader/index.vue',
  ),
  'utf8',
);
const searchInput = fs.readFileSync(
  path.resolve(__dirname, '../../../src/components/SearchInput/index.vue'),
  'utf8',
);

assert.match(source, /requireManager\('groupManager'\)/);
assert.match(source, /groupManager\(\)/);
assert.doesNotMatch(source, /\bEMClient\b/);
assert.match(
  source,
  /state\.groupDetails\.set\(groupDetail\.groupId, groupDetail\)/,
  'SDK 5.0 GroupDetail must be cached by its public groupId field.',
);
assert.match(
  source,
  /groupItem\.memberCount = members\.length/,
  'SDK 5.0 joined-group member counts must use memberCount.',
);
assert.match(
  source,
  /groupItem\.memberCount = params/,
  'SDK 5.0 group count updates must use memberCount.',
);
assert.match(
  source,
  /groupItem\.name = params/,
  'SDK 5.0 joined groups expose name, not the v4 groupName field.',
);
assert.match(
  source,
  /groupItem\.avatarUrl = params/,
  'SDK 5.0 group avatars expose avatarUrl.',
);
assert.match(
  groupAdapter,
  /name: 'name'/,
  'SDK 5.0 updateGroupInfo accepts name, not groupName.',
);
assert.match(
  groupAdapter,
  /userId: item\.user\?\.userId,\s*role: item\.role,\s*joinedAt: item\.joinedAt,/s,
  'SDK 5.0 group members must normalize GroupMemberEntry.user.userId and joinedAt.',
);
assert.match(
  groupAdapter,
  /name: form\.groupname\?\.trim\(\),\s*description: form\.desc\?\.trim\(\) \|\| '',\s*public: Boolean\(form\.public\),\s*joinApprovalRequired: Boolean\(form\.approval\),\s*allowInvites: Boolean\(form\.allowinvites\),\s*inviteNeedConfirm: Boolean\(form\.inviteNeedConfirm\),\s*maxMembers:/s,
  'SDK 5.0 createGroup must receive its complete public CreateGroupParams contract.',
);
assert.match(
  groupAdapter,
  /if \(Array\.isArray\(form\.members\) && form\.members\.length > 0\) \{\s*payload\.memberIds = form\.members;\s*\}/s,
  'SDK 5.0 optional memberIds must be omitted when no initial members are selected.',
);
assert.match(groupAdapter, /payload\.ext = String\(form\.ext\);/);
assert.doesNotMatch(
  groupAdapter,
  /\b(groupName|isPublic|needApprovalToJoin|allowMemberToInvite|maxMemberCount|extension)\s*:/,
  'The create-group adapter must not keep v4/createGroupVNext parameter names.',
);
assert.match(
  createGroups,
  /buildCreateGroupPayload\(groupCreateForm\)/,
  'The UI must call the SDK 5.0 create-group adapter.',
);
assert.match(
  createGroups,
  /await store\.dispatch\('addCreatedGroupToJoinedList', groupId\)/,
  'A newly created group must be added from the SDK 5.0 server detail before local sync catches up.',
);
assert.match(
  source,
  /addCreatedGroupToJoinedList: async \(\{ commit \}, groupId\) => \{[\s\S]*?groupManager\(\)\.getGroupInfo\(\{ groupId \}\)[\s\S]*?commit\('UPSERT_JOINED_GROUP', groupDetail\)/,
  'Created groups must be populated from the SDK 5.0 getGroupInfo result, not a fabricated legacy object.',
);
assert.match(
  source,
  /UPSERT_JOINED_GROUP: \(state, group\) => \{/,
  'The store must upsert the created SDK 5.0 group into the joined-group list.',
);
assert.doesNotMatch(createGroups, /buildCreateGroupVNextPayload/);
assert.match(
  source,
  /groupManager\(\)\.getGroup\(groupId\)\.getMembers\(\{\s*cursor,\s*pageSize: DEFAULT_GROUP_MEMBERS_PAGE_SIZE,\s*\}\)/s,
  'Group directed-message recipients must be loaded through the SDK 5.0 public Group.getMembers API.',
);
assert.match(
  source,
  /groupManager\(\)\.getGroup\(groupId\)\.getBlocklist\(\)/,
  'Group blocklists must be loaded through the SDK 5.0 public Group.getBlocklist API.',
);
assert.match(
  source,
  /const normalizedBlacklist = \(blacklist \|\| \[\]\)\.map\(\(entry\) => entry\?\.user\?\.userId\)\.filter\(Boolean\);/,
  'SDK 5.0 group blocklist entries must render the real entry.user.userId instead of the entry object.',
);
assert.match(groupDetails, /getGroupDetailFromGroupList\.name/);
assert.match(groupDetails, /\.memberCount/);
assert.match(groupDetails, /\.avatarUrl/);
assert.match(groupDetails, /\.maxMembers/);
assert.match(joinedGroups, /groupItem\.memberCount/);
assert.doesNotMatch(joinedGroups, /groupItem\.affiliationsCount/);
assert.match(groupMembers, /groupDetail\.maxMembers/);
assert.doesNotMatch(groupMembers, /groupDetail\.maxusers/);
assert.match(
  groupMembers,
  /item\?\.userId \|\| ''/,
  'SDK 5.0 group member rows must render the normalized userId.',
);
assert.match(
  groupMembers,
  /groupDetail\.value\.allowInvites/,
  'SDK 5.0 group detail exposes allowInvites, not allowinvites.',
);
assert.doesNotMatch(groupMembers, /groupDetail\.value\.allowinvites/);
assert.match(
  source,
  /inviteUsersToGroup\(\{\s*groupId,\s*userIds/s,
  'SDK 5.0 inviteUsersToGroup requires userIds.',
);
assert.doesNotMatch(source, /inviteUsersToGroup\(\{[^}]*\busers:/s);
assert.match(
  source,
  /群组邀请失败：\$\{error\?\.message/s,
  'Group invite failures must surface the SDK 5.0/server error message.',
);
assert.match(
  source,
  /userId: item\.user\.userId,\s*muteExpire: item\.muteExpire/s,
  'SDK 5.0 group mute list entries expose user.userId and muteExpire.',
);
assert.match(
  groupMuteList,
  /return store\.getters\.getGroupDetailMap\.get\(groupId\.value\)\?\.mutelist \|\| \[\]/,
  'Group mute list view must not crash before SDK data is loaded.',
);
assert.match(groupMuteList, /member\.userId/);
assert.match(groupMuteList, /member\.muteExpire/);
assert.doesNotMatch(groupMuteList, /member\.user\)/);
assert.doesNotMatch(groupMuteList, /member\.expire/);
assert.match(groupHeader, /groupDetail\?\.memberCount/);
assert.doesNotMatch(groupHeader, /groupDetail\?\.affiliationsCount/);
assert.match(searchInput, /o\.name && o\.name\.includes\(inputValue\.value\)/);
assert.doesNotMatch(searchInput, /o\.groupName && o\.groupName\.includes\(inputValue\.value\)/);
assert.match(
  groupDetails,
  /modifyType:\s*2/,
  'Group avatar edits must call SDK 5.0 updateGroupInfo with its avatar parameter and expose its real result.',
);
assert.match(
  groupDetails,
  /message:\s*error\?\.message \|\| `\$\{fieldConfig\.label\}修改失败`/,
  'Group update failures must surface the original SDK/server message.',
);

console.log('sdk5 groups store contract: PASS');
