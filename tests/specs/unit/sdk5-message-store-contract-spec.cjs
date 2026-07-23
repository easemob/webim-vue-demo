const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);

assert.match(source, /requireManager\('chatManager'\)/);
assert.match(source, /requireManager\('chatThreadManager'\)/);
assert.doesNotMatch(source, /\bEMClient\b/);
assert.doesNotMatch(source, /\.Message\.create/);

console.log('sdk5 message store contract: PASS');
