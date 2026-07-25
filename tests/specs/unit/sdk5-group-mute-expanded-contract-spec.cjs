const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const groupStore = read('src/store/modules/groups.js');
const groupDetails = read(
  'src/views/Chat/components/AboutGroups/GroupsDetails/index.vue',
);
const groupMuteList = read(
  'src/views/Chat/components/AboutGroups/GroupsManagement/GroupMuteList.vue',
);
const groupListener = read('src/IM/listener/imGroupListener.js');
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

assert.match(groupStore, /groupMuteListMembership:\s*new Map\(\)/);
assert.match(groupStore, /state\.groupMuteListMembership\.delete\(groupId\)/);
assert.match(
  groupStore,
  /SET_GROUP_MUTE_LIST_MEMBERSHIP:\s*\(state, \{ groupId, inMuteList \}\) => \{[\s\S]*state\.groupMuteListMembership\.set\(groupId, inMuteList\);[\s\S]*\}/,
  'The current-user group mute state must be stored as the raw SDK boolean.',
);
assert.match(
  groupStore,
  /checkCurrentUserInGroupMuteList: async \(\{ commit \}, groupId\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.checkIfInMuteList\(\)[\s\S]*commit\('SET_GROUP_MUTE_LIST_MEMBERSHIP', \{ groupId, inMuteList \}\)[\s\S]*return inMuteList;/,
  'The store must query current-user mute status through public Group.checkIfInMuteList.',
);
assert.match(
  groupStore,
  /muteAllGroupMembers: async \(\{ commit, dispatch \}, groupId\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.muteAllMembers\(\)[\s\S]*const groupDetail = await groupManager\(\)\.getGroup\(groupId\)\.refresh\(\);[\s\S]*commit\('SET_GROUP_DETAILS', \{ groupDetails: \[groupDetail\] \}\);[\s\S]*dispatch\('checkCurrentUserInGroupMuteList', groupId\)[\s\S]*return groupDetail;/,
  'The store must enable all-member mute through public Group.muteAllMembers and refresh real SDK state.',
);
assert.match(
  groupStore,
  /unmuteAllGroupMembers: async \(\{ commit, dispatch \}, groupId\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.unmuteAllMembers\(\)[\s\S]*const groupDetail = await groupManager\(\)\.getGroup\(groupId\)\.refresh\(\);[\s\S]*commit\('SET_GROUP_DETAILS', \{ groupDetails: \[groupDetail\] \}\);[\s\S]*dispatch\('checkCurrentUserInGroupMuteList', groupId\)[\s\S]*return groupDetail;/,
  'The store must disable all-member mute through public Group.unmuteAllMembers and refresh real SDK state.',
);
assert.match(
  groupStore,
  /getGroupMuteListMembershipMap: \(state\) => state\.groupMuteListMembership/,
);
assert.doesNotMatch(
  groupStore,
  /groupManager\(\)\.(?:muteAllGroupMembers|unmuteAllGroupMembers|checkIfInGroupMuteList)\(/,
  'The store must not call internal or invented GroupManager mute forwarding methods.',
);

assert.match(groupDetails, /const groupMuteListMembership = computed/);
assert.match(groupDetails, /getGroupMuteListMembershipMap\.get\(groupId\.value\)/);
assert.match(groupDetails, /checkCurrentUserInGroupMuteList', groupId\.value/);
assert.match(groupDetails, /groupDetail\.muteAllMembers/);

assert.match(groupMuteList, /getGroupMuteListMembershipMap\.get\(groupId\.value\)/);
assert.match(groupMuteList, /checkCurrentUserInGroupMuteList', groupId\.value/);
assert.match(groupMuteList, /muteAllGroupMembers', groupId\.value/);
assert.match(groupMuteList, /unmuteAllGroupMembers', groupId\.value/);
assert.match(groupMuteList, /groupDetail\.muteAllMembers/);
assert.match(groupMuteList, /SDK 真实错误/);
assert.doesNotMatch(
  groupMuteList,
  /(?:EMClient|conn\.|sdk4|v4|4\.24\.1|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:|fallback|adapter|兼容|兜底)/i,
  'Group mute UI must not introduce SDK 4.0 fields, adapters, or fallback paths.',
);

assert.match(
  groupListener,
  /onAllMemberMuteStateChanged:[\s\S]*?store\.dispatch\('checkCurrentUserInGroupMuteList', payload\.groupId\)/,
);
assert.match(
  casesList,
  /群全员禁言；调用 SDK 5\.0 `groupManager\.getGroup\(groupId\)\.muteAllMembers\(\)`，成功后 `refresh\(\)` 并查询当前用户禁言状态/,
);
assert.match(
  casesList,
  /解除群全员禁言；调用 SDK 5\.0 `groupManager\.getGroup\(groupId\)\.unmuteAllMembers\(\)`，成功后 `refresh\(\)` 并查询当前用户禁言状态/,
);
assert.match(
  casesList,
  /查询当前用户群禁言状态；调用 SDK 5\.0 `groupManager\.getGroup\(groupId\)\.checkIfInMuteList\(\)` 并展示真实 boolean/,
);
assert.match(
  superpowers,
  /群禁言必须只调用 SDK 5\.0 公开 `groupManager\.getGroup\(groupId\)\.getMuteList\(\)`、`muteMembers\(\{ userIds, muteDuration \}\)`、`unmuteMembers\(\{ userIds \}\)`、`muteAllMembers\(\)`、`unmuteAllMembers\(\)`、`checkIfInMuteList\(\)`/,
);
assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 193 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.match(
  coverage,
  /\| 群禁言 \| `Group\.getMuteList`, `muteMembers`, `unmuteMembers`, `muteAllMembers`, `unmuteAllMembers`, `checkIfInMuteList` \| 是 \| 查看禁言、禁言成员、解除禁言、群全员禁言、解除群全员禁言和查询当前用户禁言状态均已通过公开 `Group` facade 接入。 \| 真实权限和服务端结果以 SDK 返回为准；失败不本地回填。 \|/,
);
assert.doesNotMatch(uncovered, /群全员禁言/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 193 个，未覆盖 12 个；`@internal` 私有方法已剔除/,
);

console.log('sdk5 group mute expanded contract: PASS');
