const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const groupStore = read('src/store/modules/groups.js');
const groupDetails = read('src/views/Chat/components/AboutGroups/GroupsDetails/index.vue');
const groupsManagement = read(
  'src/views/Chat/components/AboutGroups/GroupsManagement/index.vue',
);
const groupAllowList = read(
  'src/views/Chat/components/AboutGroups/GroupsManagement/GroupAllowList.vue',
);
const groupListener = read('src/IM/listener/imGroupListener.js');
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

assert.match(groupStore, /groupAllowlists:\s*new Map\(\)/);
assert.match(groupStore, /groupAllowlistMembership:\s*new Map\(\)/);
assert.match(groupStore, /state\.groupAllowlists\.delete\(groupId\)/);
assert.match(groupStore, /state\.groupAllowlistMembership\.delete\(groupId\)/);
assert.match(
  groupStore,
  /SET_GROUP_ALLOWLIST:\s*\(state, \{ groupId, allowlist \}\)\s*=>\s*\{[\s\S]*state\.groupAllowlists\.set\(groupId, allowlist\);[\s\S]*\}/,
);
assert.match(
  groupStore,
  /SET_GROUP_ALLOWLIST_MEMBERSHIP:\s*\(state, \{ groupId, inAllowlist \}\)\s*=>\s*\{[\s\S]*state\.groupAllowlistMembership\.set\(groupId, inAllowlist\);[\s\S]*\}/,
);
assert.match(
  groupStore,
  /fetchGroupsAllowListFromServer: async \(\{ commit \}, groupId\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.getAllowlist\(\)[\s\S]*commit\('SET_GROUP_ALLOWLIST', \{ groupId, allowlist \}\)/,
  'The store must fetch the group allowlist through public Group.getAllowlist.',
);
assert.match(
  groupStore,
  /checkCurrentUserInGroupAllowList: async \(\{ commit \}, groupId\) => \{[\s\S]*groupManager\(\)[\s\S]*\.getGroup\(groupId\)[\s\S]*\.checkIfInAllowList\(\)[\s\S]*commit\('SET_GROUP_ALLOWLIST_MEMBERSHIP', \{ groupId, inAllowlist \}\)/,
  'The store must check current-user allowlist membership through public Group.checkIfInAllowList.',
);
assert.match(
  groupStore,
  /addMemberToAllowList: async \(\{ dispatch \}, \{ groupId, userIds \}\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.addUsersToAllowlist\(\{ userIds \}\)[\s\S]*dispatch\('fetchGroupsAllowListFromServer', groupId\)/,
  'The store must add members through public Group.addUsersToAllowlist.',
);
assert.match(
  groupStore,
  /removeTheMemberFromAllowList: async \(\{ dispatch \}, \{ groupId, userIds \}\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.removeUsersFromAllowlist\(\{ userIds \}\)[\s\S]*dispatch\('fetchGroupsAllowListFromServer', groupId\)/,
  'The store must remove members through public Group.removeUsersFromAllowlist.',
);
assert.match(groupStore, /getGroupAllowlistMap: \(state\) => state\.groupAllowlists/);
assert.match(
  groupStore,
  /getGroupAllowlistMembershipMap: \(state\) => state\.groupAllowlistMembership/,
);
assert.doesNotMatch(
  groupStore,
  /groupManager\(\)\.(?:getGroupAllowlist|addUsersToGroupAllowlist|removeUsersFromGroupAllowlist|checkIfInGroupAllowList)\(/,
  'The store must not call non-public or invented GroupManager allowlist forwarding methods.',
);

assert.match(groupsManagement, /import GroupAllowList from '\.\/GroupAllowList\.vue';/);
assert.match(groupsManagement, /groupAllowlist:[\s\S]*title: '群组白名单'[\s\S]*components: GroupAllowList/);
assert.match(groupDetails, /const groupAllowlist = computed/);
assert.match(groupDetails, /getGroupAllowlistMap\.get\(groupId\.value\)/);
assert.match(groupDetails, /fetchGroupsAllowListFromServer', groupId\.value/);
assert.match(groupDetails, /checkCurrentUserInGroupAllowList', groupId\.value/);
assert.match(groupDetails, /群白名单/);
assert.match(groupDetails, /alertManagementModal\('groupAllowlist'\)/);

assert.match(groupAllowList, /getGroupAllowlistMap\.get\(groupId\.value\) \|\| \[\]/);
assert.match(groupAllowList, /getGroupAllowlistMembershipMap\.get\(groupId\.value\)/);
assert.match(groupAllowList, /entry\.user\.userId/);
assert.match(groupAllowList, /fetchGroupsAllowListFromServer', groupId\.value/);
assert.match(groupAllowList, /checkCurrentUserInGroupAllowList', groupId\.value/);
assert.match(groupAllowList, /addMemberToAllowList'[\s\S]*groupId: groupId\.value,[\s\S]*userIds: \[memberId\]/);
assert.match(groupAllowList, /removeTheMemberFromAllowList'[\s\S]*groupId: groupId\.value,[\s\S]*userIds: \[memberId\]/);
assert.doesNotMatch(groupAllowList, /\b(?:username|member|jid)\s*:/);

assert.match(
  groupListener,
  /onAllowListAdded:[\s\S]*?store\.dispatch\('fetchGroupsAllowListFromServer', payload\.groupId\)/,
);
assert.match(
  groupListener,
  /onAllowListRemoved:[\s\S]*?store\.dispatch\('fetchGroupsAllowListFromServer', payload\.groupId\)/,
);

assert.match(
  casesList,
  /查看群白名单；调用 SDK 5\.0 `groupManager\.getGroup\(groupId\)\.getAllowlist\(\)` 并按 `entry\.user\.userId` 展示/,
);
assert.match(
  casesList,
  /添加群成员到白名单；调用 `addUsersToAllowlist\(\{ userIds \}\)`，成功后重新查询白名单/,
);
assert.match(
  casesList,
  /查询当前用户是否在群白名单；调用 `checkIfInAllowList\(\)` 并展示 SDK 真实 boolean/,
);
assert.match(
  superpowers,
  /群白名单必须只调用 SDK 5\.0 公开 `groupManager\.getGroup\(groupId\)\.getAllowlist\(\)`、`addUsersToAllowlist\(\{ userIds \}\)`、`removeUsersFromAllowlist\(\{ userIds \}\)`、`checkIfInAllowList\(\)`/,
);
assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 193 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.match(
  coverage,
  /\| 群白名单 \| `Group\.getAllowlist`, `addUsersToAllowlist`, `removeUsersFromAllowlist`, `checkIfInAllowList` \| 是 \| 群管理页提供白名单入口，调用 `Group\.getAllowlist\(\)` 展示 `entry\.user\.userId`，调用 `addUsersToAllowlist\(\{ userIds \}\)` 和 `removeUsersFromAllowlist\(\{ userIds \}\)` 操作成员，并调用 `checkIfInAllowList\(\)` 展示当前用户真实白名单状态。 \| 真实权限和服务端结果以 SDK 返回为准；失败不本地回填。 \|/,
);
assert.doesNotMatch(uncovered, /群组白名单/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 193 个，未覆盖 12 个；`@internal` 私有方法已剔除/,
);

console.log('sdk5 group allowlist contract: PASS');
