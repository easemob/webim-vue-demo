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

assert.match(coverage, /\| API 覆盖率 \| 93\.6% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 189 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 13 \|/);
assert.match(
  coverage,
  /\| 群组列表与详情 \| `GroupManager\.getJoinedGroupList`, `getGroup`, `Group\.getSummary`, `Group\.getDetail`, `Group\.refresh` \| 是 \|/,
  'Only public SDK 5.0 group APIs may be listed, and Group.getSummary / Group.refresh must be recorded as covered.',
);
assert.doesNotMatch(coverage, /GroupManager\.getGroupInfo|GroupManager\.getGroupInfoList/);
assert.match(
  coverage,
  /\| 群成员属性 \/ 群名片 \| `Group\.setMemberAttributes`, `getMembersAttributes` \| 是 \|/,
  'Group member attributes / namecard must be recorded as covered through public Group facade.',
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
assert.match(capabilityMatrix, /easemob-websdk 5\.0\.2/);
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
