const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const groupStore = read('src/store/modules/groups.js');
const groupMembers = read(
  'src/views/Chat/components/AboutGroups/GroupsManagement/GroupMembers.vue',
);
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

assert.match(
  groupStore,
  /groupMemberAttributes:\s*new Map\(\)/,
  'Group member attributes must be stored separately from GroupDetail and members.',
);
assert.match(
  groupStore,
  /state\.groupMemberAttributes\.delete\(groupId\)/,
  'Group member attributes must be cleared when a group is removed.',
);
assert.match(
  groupStore,
  /SET_GROUP_MEMBER_ATTRIBUTES:\s*\(state, \{ groupId, attributes \}\)\s*=>\s*\{[\s\S]*state\.groupMemberAttributes\.set\(groupId,[\s\S]*attributes[\s\S]*\);[\s\S]*\}/,
  'The raw SDK getMembersAttributes result items must be cached by groupId.',
);
assert.match(
  groupStore,
  /fetchGroupMembersAttributesFromServer: async \(\s*\{ commit \},\s*\{ groupId, userIds, keys \},\s*\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.getMembersAttributes\(\{[\s\S]*userIds,[\s\S]*keys,[\s\S]*\}\)[\s\S]*commit\('SET_GROUP_MEMBER_ATTRIBUTES', \{[\s\S]*groupId,[\s\S]*attributes: result\.items,[\s\S]*\}\);[\s\S]*return result;/,
  'The store must query member attributes through public Group.getMembersAttributes.',
);
assert.match(
  groupStore,
  /setGroupMemberAttributes: async \(\s*\{ dispatch \},\s*\{ groupId, userId, memberAttributes \},\s*\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.setMemberAttributes\(\{[\s\S]*userId,[\s\S]*memberAttributes,[\s\S]*\}\)[\s\S]*return await dispatch\('fetchGroupMembersAttributesFromServer', \{[\s\S]*groupId,[\s\S]*userIds: \[userId\],[\s\S]*keys: Object\.keys\(memberAttributes\),[\s\S]*\}\);/,
  'The store must set member attributes through public Group.setMemberAttributes and refresh the real SDK result.',
);
assert.match(groupStore, /getGroupMemberAttributesMap: \(state\) => state\.groupMemberAttributes/);
assert.doesNotMatch(
  groupStore,
  /groupManager\(\)\.(?:setGroupMemberAttributes|getGroupMembersAttributes)\(/,
  'The store must not call GroupManager internal forwarding methods.',
);
assert.doesNotMatch(
  groupStore,
  /SET_GROUP_MEMBERS_INFO|groupMemberInfo|fetchGroupMemberAttributesFromServer/,
  'The implementation must not restore the old local group-member-info contract.',
);

assert.match(
  groupMembers,
  /getGroupMemberAttributesMap\.get\(groupId\.value\) \|\| \{\}/,
  'The group-member page must read SDK member attributes from the dedicated map.',
);
assert.match(
  groupMembers,
  /fetchGroupMembersAttributesFromServer'[\s\S]*groupId: groupId\.value,[\s\S]*userIds,[\s\S]*keys: \['groupNamecard'\]/,
  'The group-member page must query SDK groupNamecard attributes for real members.',
);
assert.match(
  groupMembers,
  /setGroupMemberAttributes'[\s\S]*groupId: groupId\.value,[\s\S]*userId: editingMemberId\.value,[\s\S]*memberAttributes: \{[\s\S]*groupNamecard: groupNamecardInput\.value,[\s\S]*\}/,
  'The group-member page must set groupNamecard with SDK 5.0 memberAttributes.',
);
assert.match(groupMembers, /设置群名片/);
assert.match(groupMembers, /群名片：\{\{ getGroupMemberNamecard\(getGroupMemberUserId\(item\)\) \|\| 'SDK 未返回' \}\}/);
assert.match(
  groupMembers,
  /JSON\.stringify\(getGroupMemberAttributes\(getGroupMemberUserId\(item\)\), null, 2\)/,
  'The group-member page must expose raw SDK member attributes.',
);
assert.doesNotMatch(groupMembers, /groupMemberInfo|SET_GROUP_MEMBERS_INFO/);

assert.match(
  casesList,
  /群成员属性 \/ 群名片（调用 SDK 5\.0 `groupManager\.getGroup\(groupId\)\.setMemberAttributes\(\{ userId, memberAttributes: \{ groupNamecard \} \}\)` 设置，调用 `getMembersAttributes\(\{ userIds, keys: \['groupNamecard'\] \}\)` 查询并展示真实 `items` 和原始属性 JSON；失败保留 SDK \/ 服务端真实错误）/,
);
assert.match(
  superpowers,
  /群成员属性 \/ 群名片必须只调用 SDK 5\.0 公开 `groupManager\.getGroup\(groupId\)\.setMemberAttributes\(\{ userId, memberAttributes \}\)` 和 `getMembersAttributes\(\{ userIds, keys \}\)`/,
);
assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 193 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.match(
  coverage,
  /\| 群成员属性 \/ 群名片 \| `Group\.setMemberAttributes`, `getMembersAttributes` \| 是 \| 群成员管理页调用 `Group\.setMemberAttributes\(\{ userId, memberAttributes: \{ groupNamecard \} \}\)` 设置群名片，并调用 `Group\.getMembersAttributes\(\{ userIds, keys: \['groupNamecard'\] \}\)` 查询；页面展示 SDK 返回的 `items` 与每个成员原始属性 JSON。 \| 真实权限、属性长度、服务开通状态以 SDK \/ 服务端返回为准；失败不本地回填。 \|/,
);
assert.doesNotMatch(uncovered, /\| 群成员属性 \/ 群名片 \|/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 193 个，未覆盖 12 个；`@internal` 私有方法已剔除/,
);

console.log('sdk5 group member attributes contract: PASS');
