const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const casesList = read('cases_list.md');
const rules = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');

for (const source of [casesList, rules, coverage]) {
  assert.match(source, /按时间删除.*漫游消息/);
  assert.match(source, /beforeTimestamp/);
  assert.match(source, /单聊.*群聊|群聊.*单聊/);
  assert.doesNotMatch(source, /按时间删除[^\n]{0,360}\/notify/);
}
assert.match(coverage, /静态.*不等价于.*真实服务端|真实服务端.*验证/);

const timeDeleteRequirements = [
  /按时间删除.*漫游消息/,
  /非话题/,
  /单聊.*群聊|群聊.*单聊/,
  /二次确认/,
  /beforeTimestamp/,
  /removeHistoryMessages/,
  /getHistoryMessages/,
  /messageIds/,
  /(?:不得|不能|不以|不使用|禁止)[^。；\n]*本地.*timestamp.*过滤|本地.*timestamp.*过滤[^。；\n]*(?:不得|不能|不以|不使用|禁止)/,
  /(?:不得|不能|不以|不使用|禁止)[^。；\n]*REST notify|REST notify[^。；\n]*(?:不得|不能|不以|不使用|禁止)/,
  /(?:不得|不能|不以|不使用|禁止)[^。；\n]*自动重试|自动重试[^。；\n]*(?:不得|不能|不以|不使用|禁止)/,
  /reject|拒绝|失败/,
];
for (const requirement of timeDeleteRequirements) {
  assert.match(
    casesList,
    requirement,
    `cases_list.md 缺少按时间删除真实边界：${requirement}`,
  );
  assert.match(
    rules,
    requirement,
    `.codex/prompts/superpowers.md 缺少按时间删除真实边界：${requirement}`,
  );
  assert.match(
    coverage,
    requirement,
    `docs/sdk5-api-coverage.md 缺少按时间删除真实边界：${requirement}`,
  );
}
assert.match(
  coverage,
  /messageIds[\s\S]*?beforeTimestamp|beforeTimestamp[\s\S]*?messageIds/,
  '覆盖矩阵必须同时说明按消息 ID 和按时间两条 removeHistoryMessages 路径。',
);

const extractEntry = (source, pattern, label) => {
  const entry = source.match(pattern)?.[0];
  assert.ok(entry, `${label} 缺少按时间删除当前会话漫游消息条目`);
  return entry;
};

const timeDeleteEntries = [
  [
    'cases_list.md',
    extractEntry(
      casesList,
      /^> 当前会话顶部“更多操作”提供按时间删除漫游消息：.*$/m,
      'cases_list.md',
    ),
  ],
  [
    '.codex/prompts/superpowers.md',
    extractEntry(
      rules,
      /^- 当前会话顶部“更多操作”的按时间删除漫游消息.*$/m,
      '.codex/prompts/superpowers.md',
    ),
  ],
  [
    'docs/sdk5-api-coverage.md 覆盖矩阵',
    extractEntry(
      coverage,
      /^\| 历史、搜索、删除、撤回、编辑、合并解析 \|.*$/m,
      'docs/sdk5-api-coverage.md 覆盖矩阵',
    ),
  ],
];

const localTimeDeleteRequirements = [
  /非话题.*单聊.*群聊|非话题.*群聊.*单聊/,
  /二次确认/,
  /beforeTimestamp/,
  /SDK resolve.*getHistoryMessages.*重拉/,
  /delete.*reload.*(?:reject|失败).*不(?:得)?显示(?:删除)?成功/,
  /不得传.*messageIds/,
  /(?:不得|不能|不以|不使用|禁止)[^。；\n]*本地.*timestamp.*过滤/,
  /(?:不得|不能|不以|不使用|禁止)[^。；\n]*REST notify/,
  /(?:不得|不能|不以|不使用|禁止)[^。；\n]*自动重试/,
];
for (const [label, entry] of timeDeleteEntries) {
  for (const requirement of localTimeDeleteRequirements) {
    assert.match(entry, requirement, `${label} 局部条目缺少真实边界：${requirement}`);
  }
}
assert.match(
  timeDeleteEntries[2][1],
  /messageIds: \[msgServerId\][\s\S]*beforeTimestamp/,
  '覆盖矩阵局部行必须区分按 messageIds 单条删除和按 beforeTimestamp 删除两条路径。',
);

console.log('sdk5 roaming message time-delete docs contract: PASS');
