const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const groupStore = read('src/store/modules/groups.js');
const groupDetails = read(
  'src/views/Chat/components/AboutGroups/GroupsDetails/index.vue',
);
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

assert.match(groupStore, /groupSummaries:\s*new Map\(\)/);
assert.match(groupStore, /state\.groupSummaries\.delete\(groupId\)/);
assert.match(
  groupStore,
  /SET_GROUP_SUMMARY:\s*\(state, \{ groupId, summary \}\) => \{[\s\S]*state\.groupSummaries\.set\(groupId, summary\);[\s\S]*\}/,
  'Group.getSummary result, including null, must be stored without local synthesis.',
);
assert.match(
  groupStore,
  /readGroupSummarySnapshot: async \(\{ commit \}, groupId\) => \{[\s\S]*const summary = groupManager\(\)\.getGroup\(groupId\)\.getSummary\(\);[\s\S]*commit\('SET_GROUP_SUMMARY', \{ groupId, summary \}\);[\s\S]*return summary;/,
  'The store must cover SDK 5.0 public Group.getSummary without using internal manager forwarding methods.',
);
assert.match(groupStore, /getGroupSummaryMap: \(state\) => state\.groupSummaries/);
assert.doesNotMatch(
  groupStore,
  /groupManager\(\)\.(?:getGroupSummary|getGroupSummaryForHandle|getGroupInfo|getGroupInfoList)\(/,
  'The demo must not call internal GroupManager summary/detail forwarding methods.',
);

assert.match(groupDetails, /const groupSummary = computed/);
assert.match(groupDetails, /getGroupSummaryMap\.get\(groupId\.value\)/);
assert.match(groupDetails, /const readGroupSummarySnapshot = async \(\) => \{[\s\S]*await store\.dispatch\('readGroupSummarySnapshot', groupId\.value\)/);
assert.match(groupDetails, /读取群轻量摘要/);
assert.match(groupDetails, /formatGroupSummary\(groupSummary\)/);
assert.doesNotMatch(
  groupDetails,
  /(?:EMClient|conn\.|sdk4|v4|4\.24\.1|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:|adapter|兼容|兜底)/i,
  'Group summary UI must not introduce SDK 4.0 fields, adapters, or fallback paths.',
);

assert.match(
  casesList,
  /读取群轻量摘要；调用 SDK 5\.0 `groupManager\.getGroup\(groupId\)\.getSummary\(\)` 并展示 SDK 返回的真实 `JoinedGroupSummary \| null`/,
);
assert.match(
  superpowers,
  /群轻量摘要必须只调用 SDK 5\.0 公开 `groupManager\.getGroup\(groupId\)\.getSummary\(\)`，展示真实 `JoinedGroupSummary \| null`/,
);
assert.match(coverage, /\| API 覆盖率 \| 93\.6% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 189 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 13 \|/);
assert.match(
  coverage,
  /\| 群组列表与详情 \| `GroupManager\.getJoinedGroupList`, `getGroup`, `Group\.getSummary`, `Group\.getDetail`, `Group\.refresh` \| 是 \| 已加入群快照、单群实体、群轻量摘要、会话列表和创建后群详情均已使用公开 `GroupManager\.getJoinedGroupList`、`getGroup`、`Group\.getSummary`、`Group\.getDetail`；登录后立即读取一次本地快照，并在 SDK 5\.0 `ChatClient\.onSyncDataFinished\(\{ dataType: 'group', status: 'success' \}\)` 后刷新快照；资料更新后调用 `Group\.refresh\(\)` 并直接展示返回的 `GroupDetail`。 \| `getJoinedGroupList\(\)` 是本地同步快照读取，不主动发起服务端请求；同步失败保留真实 payload\/error，不用 REST 兜底或伪造群组。`Group\.getSummary\(\)` 是本地轻量摘要读取，可能按 SDK 真实结果返回 `null`；不通过 `getDetail` 本地伪造摘要。 \|/,
);
assert.doesNotMatch(coverage, /未覆盖 `Group\.getSummary`/);
assert.doesNotMatch(uncovered, /Group\.getSummary/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 189 个，未覆盖 13 个；`@internal` 私有方法已剔除/,
);

console.log('sdk5 group summary contract: PASS');
