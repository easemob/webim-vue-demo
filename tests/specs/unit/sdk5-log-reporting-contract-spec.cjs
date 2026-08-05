const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const logConfig = read('src/hooks/useSetEMLogConfig.js');
const settings = read('src/views/Chat/components/NavBar/components/PersonalsettingCard/index.vue');
const cases = read('cases_list.md');
const rules = read('.codex/prompts/superpowers.md');
const readme = read('README.md');
const unsupported = read('docs/sdk5-unsupported-capabilities.md');

assert.match(logConfig, /setLogLevel\('error'\)/);
assert.match(logConfig, /setLogLevel\('debug'\)/);
assert.doesNotMatch(logConfig, /donwLoadEMLog|download.*log/i);
assert.doesNotMatch(settings, /下载SDK缓存日志|donwLoadEMLog|download_log/);
assert.match(
  settings,
  /开启后在浏览器 Console 输出 SDK 日志；SDK 是否自动上报由当前环境 DNS 的 enableReportLogs 配置决定。/,
);
assert.doesNotMatch(cases, /下载 SDK 缓存日志/);
assert.match(cases, /enableReportLogs/);
assert.match(rules, /enableReportLogs/);
assert.doesNotMatch(readme, /下载 SDK 缓存日志/);
assert.match(
  unsupported,
  /\| 下载 SDK 缓存日志 \| Demo 无入口 \| 公开入口只有 `setLogLevel`，不含日志缓存\/下载 API \| Demo 不提供下载或手动上报入口；SDK 内部自动上报仅由登录时 DNS 的 `enableReportLogs` 决定 \| 已确认不支持 \|/,
);

console.log('sdk5 log reporting contract: PASS');
