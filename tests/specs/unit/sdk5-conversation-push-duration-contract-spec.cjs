const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../../src/utils/conversationPushSettings.js'),
  'utf8',
);

assert.match(
  source,
  /mode:\s*'DURATION',[\s\S]*duration,\s*\n\s*},/,
  'SDK 5.0 DND duration must remain the user-selected minute value.',
);
assert.doesNotMatch(
  source,
  /duration:\s*duration\s*\*\s*60/,
  'SDK 5.0 converts DND minutes itself; the demo must not send seconds.',
);

console.log('sdk5 conversation push duration contract: PASS');
