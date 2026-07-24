const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/groups.js'),
  'utf8',
);

assert.doesNotMatch(source, /GROUP_OPERATION_TYPE/);
assert.doesNotMatch(source, /UPDATE_GROUP_MEMBERS|UPDATE_GORUPS_ADMIN/);
assert.doesNotMatch(source, /\b(?:member|type|userId)\s*:\s*payload/);

console.log('sdk5 group store native-events contract: PASS');
