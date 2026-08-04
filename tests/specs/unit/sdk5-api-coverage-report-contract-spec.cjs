const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../../..');
const result = spawnSync(
  process.execPath,
  ['scripts/sdk5-api-coverage.cjs', '--json'],
  {
    cwd: projectRoot,
    encoding: 'utf8',
  },
);

assert.equal(result.status, 0, result.stderr || result.stdout);

const report = JSON.parse(result.stdout);

assert.equal(report.sdk.majorVersion, '5.0');
assert.equal(report.sourceRoot, 'src');
assert.equal(report.total, 204);
assert.equal(report.covered, 192);
assert.equal(report.uncovered, 12);
assert.equal(report.coveragePercent, '94.1%');

assert.deepEqual(report.uncoveredApis, [
  'ChatClient.use',
  'ChatThreadManager.destroyChatThread',
  'ChatThreadManager.getChatThreadInfo',
  'ChatThreadManager.getChatThreadMemberList',
  'ChatThreadManager.joinChatThread',
  'ChatThreadManager.leaveChatThread',
  'ChatThreadManager.removeChatThreadMember',
  'ChatThreadManager.updateChatThreadName',
  'GroupManager.getGroupInfo',
  'GroupManager.getGroupInfoList',
  'createPlatformAdapter',
  'detectRuntimePlatform',
]);

assert.equal(
  report.excludedApis['ChatClient.refreshSessionList'],
  '@internal declaration',
);
assert.equal(
  report.excludedApis['ChatManager.refreshSessionList'],
  '@internal declaration',
);
assert.equal(
  report.excludedApis['GroupManager.getPublicGroupList'],
  '@internal declaration',
);

console.log('sdk5 API coverage report contract: PASS');
