const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const patterns = [
  '\\bEMClient\\b',
  'WebIM\\.message\\.create',
  '\\bconn\\.',
  '\\b(?:sdk4|v4|legacy)\\b',
  '\\b(?:messageAdapter|sdk4Adapter)\\b',
  '\\b(?:MESSAGE_TYPE|SESSION_MESSAGE_TYPE)\\b',
  '\\broomId\\b',
  '\\bnormalizeChatroomMembers\\b',
  '\\bnormalizeThread(?:Detail|Members|List|LatestMessage)Response\\b',
];
for (const pattern of patterns) {
  const result = spawnSync('rg', ['-n', pattern, 'src'], { encoding: 'utf8' });
  assert.ok(result.status === 0 || result.status === 1, result.stderr);
  const output = result.stdout.trim();
  assert.equal(output, '', `SDK 5.0 migration guard failed for ${pattern}:\n${output}`);
}
console.log('sdk5 migration guard: PASS');
