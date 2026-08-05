const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');
}

const source = read('src/store/modules/groups.js');
const createGroups = read(
  'src/views/Chat/components/NavBar/components/ApplyComponents/createGroups.vue',
);
const groupDetails = read('src/views/Chat/components/AboutGroups/GroupsDetails/index.vue');
const groupBlackList = read(
  'src/views/Chat/components/AboutGroups/GroupsManagement/GroupBlackList.vue',
);
const groupMuteList = read(
  'src/views/Chat/components/AboutGroups/GroupsManagement/GroupMuteList.vue',
);
const groupAnnouncement = read(
  'src/views/Chat/components/AboutGroups/GroupsManagement/GroupAnnoun.vue',
);
const groupMembers = read(
  'src/views/Chat/components/AboutGroups/GroupsManagement/GroupMembers.vue',
);
const groupSharedFiles = read(
  'src/views/Chat/components/AboutGroups/GroupsManagement/GroupSharedFiles.vue',
);
const joinedGroups = read('src/views/Chat/components/Contacts/components/JoinedGroupsItem.vue');
const groupHeader = read(
  'src/views/Chat/components/Message/components/ChatContainerHeader/index.vue',
);
const searchInput = read('src/components/SearchInput/index.vue');

assert.match(source, /requireManager\('groupManager'\)/);
assert.match(source, /groupManager\(\)/);
assert.doesNotMatch(source, /\bEMClient\b/);
assert.doesNotMatch(
  source,
  /\b(?:groupsInfos|pagingParams|SET_JOINED_GROUP|RESET_JOINED_GROUP_LIST|UPDATE_GROUP_SHIELD_STATUS|shieldgroup|UPDATE_CACHE_GROUP_INFO|blockGroupMessage|unblockGroupMessage|fetchInTheGroupInfoFromServer|fetchGroupMemberAttributesFromServer|SET_GROUP_MEMBERS_INFO)\b/,
  'The SDK 5.0 group store must not retain unused legacy cache or unsupported-operation state.',
);
assert.match(
  source,
  /joinedGroups:\s*\[\]/,
  'Joined groups must be stored as raw SDK 5.0 summaries, without a local paging envelope.',
);
assert.match(
  source,
  /SET_JOINED_GROUPS:\s*\(state, groups\)\s*=>\s*\{\s*state\.joinedGroups = groups;/s,
  'The joined-group snapshot must be replaced with the raw SDK 5.0 GroupManager result.',
);
assert.match(
  source,
  /groupManager\(\)\.getJoinedGroupList\(\)[\s\S]*?commit\('SET_JOINED_GROUPS', groups\)/,
  'Joined groups must be refreshed from the SDK 5.0 manager snapshot.',
);
assert.match(
  source,
  /state\.groupDetails\.set\(groupDetail\.groupId, groupDetail\)/,
  'SDK 5.0 GroupDetail must be cached by its public groupId field.',
);
assert.match(
  source,
  /SET_GROUP_MEMBERS:\s*\(state, \{ groupId, members \}\)\s*=>\s*\{\s*state\.groupMembers\.set\(groupId, members\);/s,
  'Group members must remain raw SDK 5.0 GroupMemberEntry objects.',
);
assert.doesNotMatch(
  source,
  /normalizeFetchedGroupMembers|normalizeGroupSharedFileList|memberCount = members\.length/,
  'The group store must not translate SDK 5.0 responses or infer member counts locally.',
);
assert.match(
  source,
  /groupBlocklists:\s*new Map\(\)/,
  'Blocklists must be kept separately from GroupDetail.',
);
assert.match(
  source,
  /groupMuteLists:\s*new Map\(\)/,
  'Mute lists must be kept separately from GroupDetail.',
);
assert.match(
  source,
  /groupAnnouncements:\s*new Map\(\)/,
  'Announcements must be kept separately from GroupDetail.',
);
assert.match(
  source,
  /state\.groupBlocklists\.set\(groupId, blocklist\)/,
  'Blocklist entries must be stored without converting entry.user.userId.',
);
assert.match(
  source,
  /state\.groupMuteLists\.set\(groupId, muteList\)/,
  'Mute entries must be stored without converting entry.user.userId.',
);
assert.match(
  source,
  /state\.groupAnnouncements\.set\(groupId, announcement\)/,
  'The raw GroupAnnouncement must be stored separately from GroupDetail.',
);
assert.match(
  source,
  /state\.groupSharedFiles\.set\(groupId, result\.items\)/,
  'Shared-file entries must be the raw GroupSharedFileListResult.items array.',
);
assert.doesNotMatch(
  source,
  /groupDetails\.get\(groupId\)\.(?:blacklist|mutelist|announcement|groupMemberInfo)/,
  'GroupDetail must not be extended with non-GroupDetail SDK responses.',
);
assert.match(
  source,
  /await groupManager\(\)\.getGroup\(groupId\)\.updateInfo\([\s\S]*?const groupDetail = await groupManager\(\)\.getGroup\(groupId\)\.refresh\(\);[\s\S]*?commit\('SET_GROUP_DETAILS', \{ groupDetails: \[groupDetail\] \}\);/,
  'Group profile mutations must refresh the real SDK 5.0 GroupDetail instead of patching local display fields.',
);

assert.match(
  createGroups,
  /const groupCreateForm = reactive\(\{\s*name: '',\s*avatar: '',\s*description: '',\s*ext: '',\s*memberIds: \[\],\s*public: true,\s*joinApprovalRequired: true,\s*allowInvites: true,\s*inviteNeedConfirm: true,\s*maxMembers: 200,/s,
  'The group-create form must store the SDK 5.0 CreateGroupParams names directly.',
);
assert.match(
  createGroups,
  /const \{ groupId \} = await requireManager\('groupManager'\)\.createGroup\(groupCreateForm\);/,
  'The group-create page must pass native CreateGroupParams directly to SDK 5.0 without an adapter.',
);
assert.doesNotMatch(
  createGroups,
  /groupDocAdapters|buildCreateGroupPayload|\b(?:groupname|desc|maxusers|allowinvites|approval|members)\b/,
  'The group-create page must not retain a V4-shaped form model or parameter mapping.',
);
assert.match(
  source,
  /const DEFAULT_GROUP_MEMBERS_PAGE_SIZE = 50;/,
  'The group-member page size must remain local to the SDK 5.0 group store after removing the obsolete adapter module.',
);
assert.match(
  createGroups,
  /await store\.dispatch\('addCreatedGroupToJoinedList', groupId\)/,
  'A newly created group must be added from the SDK 5.0 server detail before local sync catches up.',
);
assert.match(
  source,
  /addCreatedGroupToJoinedList: async \(\{ commit \}, groupId\) => \{[\s\S]*?groupManager\(\)\.getGroup\(groupId\)\.getDetail\(\)[\s\S]*?commit\('UPSERT_JOINED_GROUP', groupDetail\)/,
  'Created groups must be populated from the SDK 5.0 Group.getDetail result, not a fabricated object.',
);
assert.match(source, /UPSERT_JOINED_GROUP: \(state, group\) => \{/);

assert.match(
  source,
  /groupManager\(\)\.getGroup\(groupId\)\.getMembers\(\{\s*cursor,\s*pageSize: DEFAULT_GROUP_MEMBERS_PAGE_SIZE,\s*\}\)/s,
  'Group directed-message recipients must be loaded through the SDK 5.0 public Group.getMembers API.',
);
assert.match(source, /groupManager\(\)\.getGroup\(groupId\)\.getBlocklist\(\)/);
assert.doesNotMatch(
  source,
  /groupManager\(\)\.(?:getGroupInfo|getGroupMembersAttributes|setGroupMemberAttributes|getGroupAnnouncement|updateGroupInfo|updateGroupAnnouncement|getGroupSharedFileList|uploadGroupSharedFile|downloadGroupSharedFile|deleteGroupSharedFile|removeGroupMembers|blockGroupMembers|unblockGroupMembers|muteGroupMembers|unmuteGroupMembers|leaveGroup|destroyGroup)\(/,
  'The SDK 5.0 store must not call GroupManager internal forwarding methods.',
);
for (const publicGroupMethod of [
  'getDetail',
  'refresh',
  'getAnnouncement',
  'updateInfo',
  'updateAnnouncement',
  'getSharedFileList',
  'uploadSharedFile',
  'downloadSharedFile',
  'deleteSharedFile',
  'removeMembers',
  'blockMembers',
  'unblockMembers',
  'muteMembers',
  'unmuteMembers',
  'leave',
  'destroy',
]) {
  assert.match(
    source,
    new RegExp(`getGroup\\(groupId\\)\\s*\\.\\s*${publicGroupMethod}\\(`),
    `The SDK 5.0 Group facade must call ${publicGroupMethod}.`,
  );
}

assert.match(groupBlackList, /getGroupBlocklistMap\.get\(groupId\.value\) \|\| \[\]/);
assert.match(groupBlackList, /entry\.user\.userId/);
assert.match(groupMuteList, /getGroupMuteListMap\.get\(groupId\.value\) \|\| \[\]/);
assert.match(groupMuteList, /member\.user\.userId/);
assert.match(groupAnnouncement, /getGroupAnnouncementMap\.get\(groupId\.value\)\?\.announcement/);
assert.match(
  groupAnnouncement,
  /onMounted\(\(\) => \{\s*if \(!memberRole\.value\) return;\s*nextTick\(\(\) => \{\s*editAnnouncment\('edit', getGroupAnnouncement\.value\);/s,
  'Regular members must keep group announcements read-only and must not enter the input focus flow.',
);
assert.match(groupSharedFiles, /getGroupSharedFilesMap\.get\(groupId\.value\) \|\| \[\]/);
assert.match(groupMembers, /member\.user\.userId/);
assert.match(groupDetails, /getGroupBlocklistMap\.get\(groupId\.value\)/);
assert.match(groupDetails, /getGroupMuteListMap\.get\(groupId\.value\)/);
assert.match(groupDetails, /getGroupAnnouncementMap\.get\(groupId\.value\)\?\.announcement/);
assert.match(joinedGroups, /groupItem\.memberCount/);
assert.doesNotMatch(joinedGroups, /groupItem\.affiliationsCount/);
assert.match(groupHeader, /groupDetail\?\.memberCount/);
assert.doesNotMatch(groupHeader, /groupDetail\?\.affiliationsCount/);
assert.match(searchInput, /o\.name && o\.name\.includes\(inputValue\.value\)/);
assert.doesNotMatch(searchInput, /o\.groupName && o\.groupName\.includes\(inputValue\.value\)/);

console.log('sdk5 groups store contract: PASS');
