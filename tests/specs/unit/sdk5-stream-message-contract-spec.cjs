const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const streamSupport = fs.readFileSync(
  path.resolve(__dirname, '../../../src/utils/streamMessageSupport.js'),
  'utf8',
);

for (const status of [
  'STREAM_START',
  'STREAM_IN_PROGRESS',
  'STREAM_COMPLETED',
  'STREAM_FULL',
  'STREAM_ERROR',
]) {
  assert.match(
    streamSupport,
    new RegExp(`\\b${status}\\b`),
    `SDK 5.0 stream status ${status} must be rendered directly.`,
  );
}

assert.doesNotMatch(
  streamSupport,
  /STREAM_MIN_SDK_VERSION|isSdkVersionAtLeast|normalizeVersion|4\.19\.1/,
  'A WebSDK 5.0-only demo must not retain an SDK 4.x stream compatibility gate.',
);
assert.doesNotMatch(
  streamSupport,
  /START_AND_COMPLETE|\bSTART:\s*'|\bIN_PROGRESS:\s*'|\bCOMPLETED:\s*'|\bERROR:\s*'/,
  'Stream labels must not use pre-5.0 status aliases.',
);

console.log('sdk5 stream message contract: PASS');
