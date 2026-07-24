const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/groups.js'),
  'utf8',
);

assert.match(
  source,
  /fetchGroupDetailFromServer: async \(\{ commit \}, groupIds = \[\]\) => \{/,
  'The group detail fetch action must remain the single SDK-backed entry for conversation group details.',
);
const detailFetchAction = source
  .split('fetchGroupDetailFromServer:')[1]
  .split('fetchGroupsMemberFromServer:')[0];

assert.doesNotMatch(
  detailFetchAction,
  /Promise\.all\(/,
  'A single missing group must not reject the whole SDK 5.0 group-detail batch.',
);
assert.match(
  detailFetchAction,
  /Promise\.allSettled\(/,
  'SDK 5.0 group-detail batches must preserve per-group success and failure results.',
);
assert.match(
  source,
  /fulfilledGroupDetails/,
  'Successful SDK 5.0 Group.getDetail results must still be committed when another group fails.',
);
assert.match(
  source,
  /failedGroupDetails/,
  'Failed SDK 5.0 Group.getDetail results must be logged and returned without fabricating group details.',
);
assert.match(
  source,
  /commit\('SET_GROUP_DETAILS', \{ groupDetails: fulfilledGroupDetails \}\)/,
  'Only successful real SDK group details may be cached.',
);
assert.match(
  source,
  /return \{\s*fulfilledGroupDetails,\s*failedGroupDetails\s*\}/s,
  'The caller must receive the real per-group success/failure summary.',
);

console.log('sdk5 group detail partial-failure contract: PASS');
