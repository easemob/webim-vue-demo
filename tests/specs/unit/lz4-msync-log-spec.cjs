const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../../..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

test('lz4 msync decode logging wraps the real SDK decoder without masking failures', () => {
  const content = read('src/IM/miniCore/index.js');

  assert.match(content, /function getMsyncPacketLogContext/);
  assert.match(content, /function wrapMsyncDecodeLogger/);
  assert.match(content, /\.mSync\.decodeMSync = function wrappedDecodeMSync/);
  assert.match(content, /originalDecodeMSync\.call\(this, packet, \.\.\.rest\)/);
  assert.match(content, /console\.log\('\[LZ4 \/ MSync Decode\] decodeMSync request'/);
  assert.match(content, /console\.log\('\[LZ4 \/ MSync Decode\] decodeMSync success'/);
  assert.match(content, /console\.error\('\[LZ4 \/ MSync Decode\] decodeMSync failed'/);
  assert.match(content, /throw error/);
  assert.doesNotMatch(content, /mock|fake success|模拟成功|兜底成功/i);
});

test('lz4 msync decode logging documentation is synced', () => {
  assert.match(read('cases_list.md'), /LZ4 \/ MSync 解码日志/);
  assert.match(read('.codex/prompts/superpowers.md'), /LZ4 \/ MSync 解码日志/);
});
