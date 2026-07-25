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
const groupConfigsOwner = readOptional(
  'src/views/Chat/components/AboutGroups/GroupsManagement/GroupConfigsOwner.vue',
);
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

assert.match(
  groupStore,
  /updateGroupConfigs: async \(\{ commit \}, \{ groupId, configs \}\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.updateConfigs\(configs\)[\s\S]*const groupDetail = await groupManager\(\)\.getGroup\(groupId\)\.refresh\(\);[\s\S]*commit\('SET_GROUP_DETAILS', \{ groupDetails: \[groupDetail\] \}\);[\s\S]*commit\('UPSERT_JOINED_GROUP', groupDetail\);[\s\S]*return groupDetail;/,
  'The store must call public Group.updateConfigs and refresh the real SDK group detail.',
);
assert.match(
  groupStore,
  /changeGroupOwner: async \(\{ commit \}, \{ groupId, newOwner \}\) => \{[\s\S]*groupManager\(\)\.getGroup\(groupId\)\.changeOwner\(\{ newOwner \}\)[\s\S]*const groupDetail = await groupManager\(\)\.getGroup\(groupId\)\.refresh\(\);[\s\S]*commit\('SET_GROUP_DETAILS', \{ groupDetails: \[groupDetail\] \}\);[\s\S]*commit\('UPSERT_JOINED_GROUP', groupDetail\);[\s\S]*return groupDetail;/,
  'The store must call public Group.changeOwner with { newOwner } and refresh the real SDK group detail.',
);
assert.doesNotMatch(
  groupStore,
  /groupManager\(\)\.(?:updateGroupConfigs|changeGroupOwner|transferGroupOwner|updateGroupSetting)\(/,
  'The store must not call invented or old GroupManager forwarding methods.',
);

assert.match(groupsManagement, /import GroupConfigsOwner from '\.\/GroupConfigsOwner\.vue';/);
assert.match(
  groupsManagement,
  /groupConfigsOwner:\s*\{[\s\S]*title: '群配置与群主'[\s\S]*components: GroupConfigsOwner/,
);
assert.match(groupDetails, /alertManagementModal\('groupConfigsOwner'\)/);
assert.match(groupDetails, /群配置与群主/);
assert.match(groupDetails, /groupDetail\.role === GROUP_ROLE_TYPE\.OWNER/);

assert.match(groupConfigsOwner, /const GROUP_CONFIG_FIELDS = \[/);
assert.match(groupConfigsOwner, /key: 'public'/);
assert.match(groupConfigsOwner, /key: 'joinApprovalRequired'/);
assert.match(groupConfigsOwner, /key: 'allowInvites'/);
assert.match(groupConfigsOwner, /key: 'inviteNeedConfirm'/);
assert.match(groupConfigsOwner, /maxMembers/);
assert.match(
  groupConfigsOwner,
  /store\.dispatch\('updateGroupConfigs', \{[\s\S]*groupId: groupId\.value,[\s\S]*configs,[\s\S]*\}\)/,
  'The page must submit SDK 5.0 GroupUpdateConfigsInput through the store.',
);
assert.match(
  groupConfigsOwner,
  /store\.dispatch\('changeGroupOwner', \{[\s\S]*groupId: groupId\.value,[\s\S]*newOwner: newOwner\.value\.trim\(\),[\s\S]*\}\)/,
  'The page must submit SDK 5.0 GroupOwnerChangeInput through the store.',
);
assert.match(groupConfigsOwner, /SDK 真实群详情/);
assert.match(groupConfigsOwner, /SDK 真实错误/);
assert.doesNotMatch(
  groupConfigsOwner,
  /(?:EMClient|conn\.|sdk4|v4|4\.24\.1|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:|fallback|adapter|兼容|兜底)/i,
  'Group config and owner UI must not introduce SDK 4.0 fields, adapters, or fallback paths.',
);

assert.match(
  casesList,
  /群配置与群主：调用 SDK 5\.0 `groupManager\.getGroup\(groupId\)\.updateConfigs\(\{ public, joinApprovalRequired, allowInvites, inviteNeedConfirm, maxMembers \}\)` 更新群配置；调用 `changeOwner\(\{ newOwner \}\)` 转让群主；成功后 `refresh\(\)` 并展示 SDK 真实群详情，失败展示真实错误/,
);
assert.match(
  superpowers,
  /群配置更新和群主转让必须只调用 SDK 5\.0 公开 `groupManager\.getGroup\(groupId\)\.updateConfigs\(\{ public, joinApprovalRequired, allowInvites, inviteNeedConfirm, maxMembers \}\)` 与 `changeOwner\(\{ newOwner \}\)`/,
);
assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 193 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.match(
  coverage,
  /\| 群组基础资料、配置和所有权 \| `Group\.updateInfo`, `updateConfigs`, `changeOwner` \| 是 \| 修改群名称、描述、头像、扩展信息已通过公开 `groupManager\.getGroup\(groupId\)\.updateInfo\(\)` 接入；群管理页提供群配置与群主入口，调用 `Group\.updateConfigs\(\{ public, joinApprovalRequired, allowInvites, inviteNeedConfirm, maxMembers \}\)` 更新配置，调用 `Group\.changeOwner\(\{ newOwner \}\)` 转让群主，成功后调用 `refresh\(\)` 并展示 SDK 真实 `GroupDetail`。 \| 真实权限、配置限制和转让结果以 SDK \/ 服务端返回为准；失败不本地回填。 \|/,
);
assert.doesNotMatch(uncovered, /群配置更新/);
assert.doesNotMatch(uncovered, /群主转让/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 193 个，未覆盖 12 个；`@internal` 私有方法已剔除/,
);

console.log('sdk5 group configs owner contract: PASS');
