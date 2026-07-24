const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.resolve(
  __dirname,
  '../../../src/utils/sdk5ErrorInfo.js',
);

assert.ok(
  fs.existsSync(sourcePath),
  'SDK 5.0 error consumers need a shared message/code/details reader.',
);

const source = fs.readFileSync(sourcePath, 'utf8');
assert.match(source, /error\?\.message/);
assert.match(source, /error\?\.code/);
assert.match(source, /error\?\.details/);
assert.doesNotMatch(source, /\b(?:error|reason|raw)\?*\.(?:msg|reason|error_description|error|type|data)\b/);

console.log('sdk5 error info contract: PASS');
