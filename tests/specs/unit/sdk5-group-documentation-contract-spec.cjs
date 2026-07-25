const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');
const unsupported = read('docs/sdk5-unsupported-capabilities.md');
const capabilityMatrix = read('docs/sdk5-capability-matrix.md');
const casesList = read('cases_list.md');
const projectRules = read('.codex/prompts/superpowers.md');
const conversationStore = read('src/store/modules/conversation.js');

assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 193 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.match(
  coverage,
  /\| 群组列表与详情 \| `GroupManager\.getJoinedGroupList`, `getGroup`, `Group\.getSummary`, `Group\.getDetail`, `Group\.refresh` \| 是 \|/,
  'Only public SDK 5.0 group APIs may be listed, and Group.getSummary / Group.refresh must be recorded as covered.',
);
assert.match(
  coverage,
  /`GroupManager\.getGroupInfo`、`getGroupInfoList` 是公开直调 API，当前为维持 facade 单路径未调用，因此计为 `2` 个静态缺口/,
  'Public SDK 5.0 GroupManager direct APIs must be reported as static gaps when the Demo intentionally uses the Group facade only.',
);
assert.match(
  coverage,
  /\| 群成员属性 \/ 群名片 \| `Group\.setMemberAttributes`, `getMembersAttributes` \| 是 \|/,
  'Group member attributes / namecard must be recorded as covered through public Group facade.',
);
assert.match(
  coverage,
  /Group\.getAdmins\(\)` 展示 `GroupUserInfo\[\]`/,
  'WebSDK 5.0 Group.getAdmins returns GroupUserInfo[], not UserInfo[].',
);
assert.match(
  casesList,
  /GroupUserInfo\[\]/,
  'The feature list must preserve the WebSDK 5.0 Group.getAdmins return type.',
);
assert.match(
  projectRules,
  /GroupUserInfo\[\]/,
  'Project rules must preserve the WebSDK 5.0 Group.getAdmins return type.',
);
assert.doesNotMatch(
  uncovered,
  /\| 群成员属性 \/ 群名片 \| `groupManager\.getGroup\(groupId\)\.setMemberAttributes\(\)` \/ `getMembersAttributes\(\)` \|/,
  'Covered group member attributes / namecard must be removed from uncovered capabilities.',
);
assert.match(
  coverage,
  /\| 群白名单 \| `Group\.getAllowlist`, `addUsersToAllowlist`, `removeUsersFromAllowlist`, `checkIfInAllowList` \| 是 \|/,
  'Group allowlist must be recorded as covered through public Group facade.',
);
assert.match(
  unsupported,
  /\| 屏蔽\/取消屏蔽群消息 \| Demo 无入口 \|/,
  'The unsupported report must not describe a removed UI entry.',
);
assert.match(capabilityMatrix, /WebSDK 5\.0/);
assert.doesNotMatch(capabilityMatrix, /\b5\.0\.\d+\b/);
assert.match(
  capabilityMatrix,
  /`groupManager\.getJoinedGroupList`、`groupManager\.getGroup\(groupId\)\.getDetail\(\)` \/ `refresh\(\)`/,
);
assert.doesNotMatch(capabilityMatrix, /getGroupInfo|边界映射为现有展示字段/);
assert.match(casesList, /`groupManager\.getGroup\(groupId\)\.updateInfo\(\{ avatar \}\)`，后调用 `refresh\(\)`/);
assert.doesNotMatch(casesList, /updateGroupInfo\(\{ groupId, avatar \}\)/);
assert.match(projectRules, /`groupManager\.getGroup\(groupId\)\.updateInfo\(\{ name \/ description \/ avatar \/ ext \}\)` 后调用 `refresh\(\)`/);
assert.doesNotMatch(projectRules, /SDK 5\.0\.0/);
assert.match(conversationStore, /仅群聊会话可调用 SDK 5\.0 `Group\.getDetail\(\)`/);

console.log('sdk5 group documentation contract: PASS');
