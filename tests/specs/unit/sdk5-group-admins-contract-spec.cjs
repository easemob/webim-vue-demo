const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');
const readOptional = (relativePath) => {
  try {
    return read(relativePath);
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
};

const groupStore = read('src/store/modules/groups.js');
const groupDetails = read(
  'src/views/Chat/components/AboutGroups/GroupsDetails/index.vue',
);
const groupsManagement = read(
  'src/views/Chat/components/AboutGroups/GroupsManagement/index.vue',
);
const groupAdmins = readOptional(
  'src/views/Chat/components/AboutGroups/GroupsManagement/GroupAdmins.vue',
);
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

assert.match(groupStore, /groupAdmins:\s*new Map\(\)/);
assert.match(groupStore, /state\.groupAdmins\.delete\(groupId\)/);
assert.match(
  groupStore,
  /SET_GROUP_ADMINS:\s*\(state, \{ groupId, admins \}\)\s*=>\s*\{[\s\S]*state\.groupAdmins\.set\(groupId, admins\);[\s\S]*\}/,
  'Group admins must be stored as the raw SDK 5.0 UserInfo[] result.',
);
assert.match(
  groupStore,
  /fetchGroupAdminsFromServer: async \(\{ commit \}, groupId\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.getAdmins\(\)[\s\S]*commit\('SET_GROUP_ADMINS', \{ groupId, admins \}\)[\s\S]*return admins;/,
  'The store must fetch admins through public Group.getAdmins.',
);
assert.match(
  groupStore,
  /addGroupAdmin: async \(\{ dispatch \}, \{ groupId, userId \}\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.addAdmin\(\{ userId \}\)[\s\S]*dispatch\('fetchGroupAdminsFromServer', groupId\)[\s\S]*dispatch\('fetchGroupsMemberFromServer', \{ groupId \}\)/,
  'The store must add admins through public Group.addAdmin({ userId }) and refresh real SDK lists.',
);
assert.match(
  groupStore,
  /removeGroupAdmin: async \(\{ dispatch \}, \{ groupId, userId \}\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.removeAdmin\(\{ userId \}\)[\s\S]*dispatch\('fetchGroupAdminsFromServer', groupId\)[\s\S]*dispatch\('fetchGroupsMemberFromServer', \{ groupId \}\)/,
  'The store must remove admins through public Group.removeAdmin({ userId }) and refresh real SDK lists.',
);
assert.match(groupStore, /getGroupAdminsMap: \(state\) => state\.groupAdmins/);
assert.doesNotMatch(
  groupStore,
  /groupManager\(\)\.(?:getGroupAdminList|addGroupAdmin|removeGroupAdmin)\(/,
  'The store must not call internal GroupManager admin forwarding methods.',
);

assert.match(groupsManagement, /import GroupAdmins from '\.\/GroupAdmins\.vue';/);
assert.match(
  groupsManagement,
  /groupAdmins:\s*\{[\s\S]*title: '群组管理员'[\s\S]*components: GroupAdmins/,
);
assert.match(groupDetails, /const groupAdmins = computed/);
assert.match(groupDetails, /getGroupAdminsMap\.get\(groupId\.value\)/);
assert.match(groupDetails, /fetchGroupAdminsFromServer', groupId\.value/);
assert.match(groupDetails, /群组管理员/);
assert.match(groupDetails, /alertManagementModal\('groupAdmins'\)/);

assert.match(groupAdmins, /getGroupAdminsMap\.get\(groupId\.value\) \|\| \[\]/);
assert.match(groupAdmins, /fetchGroupAdminsFromServer', groupId\.value/);
assert.match(groupAdmins, /addGroupAdmin'[\s\S]*groupId: groupId\.value,[\s\S]*userId: memberId/);
assert.match(groupAdmins, /removeGroupAdmin'[\s\S]*groupId: groupId\.value,[\s\S]*userId: adminId/);
assert.match(groupAdmins, /admin\.userId/);
assert.match(groupAdmins, /member\.user\.userId/);
assert.match(groupAdmins, /SDK 真实错误/);
assert.doesNotMatch(
  groupAdmins,
  /(?:EMClient|conn\.|sdk4|v4|4\.24\.1|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:|fallback|adapter|兼容|兜底)/i,
  'Group admins UI must not introduce SDK 4.0 fields, adapters, or fallback paths.',
);

assert.match(
  casesList,
  /查看群管理员列表；调用 SDK 5\.0 `groupManager\.getGroup\(groupId\)\.getAdmins\(\)` 并按 `admin\.userId` 展示/,
);
assert.match(
  casesList,
  /添加群管理员；调用 `addAdmin\(\{ userId \}\)`，成功后重新查询管理员和成员列表/,
);
assert.match(
  casesList,
  /移除群管理员；调用 `removeAdmin\(\{ userId \}\)`，成功后重新查询管理员和成员列表/,
);
assert.match(
  superpowers,
  /群管理员必须只调用 SDK 5\.0 公开 `groupManager\.getGroup\(groupId\)\.getAdmins\(\)`、`addAdmin\(\{ userId \}\)`、`removeAdmin\(\{ userId \}\)`/,
);
assert.match(coverage, /\| API 覆盖率 \| 93\.6% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 189 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 13 \|/);
assert.match(
  coverage,
  /\| 群成员与管理员 \| `Group\.getMembers`, `removeMembers`, `getAdmins`, `addAdmin`, `removeAdmin` \| 是 \| 群成员列表、群组定向消息成员来源和移出成员已使用公开 `Group\.getMembers` \/ `removeMembers`；群管理页提供管理员入口，调用 `Group\.getAdmins\(\)` 展示 `UserInfo\[\]`，调用 `Group\.addAdmin\(\{ userId \}\)` 和 `Group\.removeAdmin\(\{ userId \}\)` 操作管理员，成功后重新查询管理员和成员列表。 \| 真实权限和服务端结果以 SDK 返回为准；失败不本地回填。 \|/,
);
assert.doesNotMatch(uncovered, /群管理员/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 189 个，未覆盖 13 个；`@internal` 私有方法已剔除/,
);

console.log('sdk5 group admins contract: PASS');
