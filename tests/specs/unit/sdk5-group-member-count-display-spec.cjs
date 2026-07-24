const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const groupDetails = fs.readFileSync(
  path.join(root, 'src/views/Chat/components/AboutGroups/GroupsDetails/index.vue'),
  'utf8',
);

assert.match(
  groupDetails,
  /const memberCountDisplay = computed\(\(\) => \{\s*return groupDetail\.value\.memberCount \?\? '-';\s*\}\);/s,
  'Member count must be the exact SDK 5.0 GroupDetail.memberCount value.',
);
assert.doesNotMatch(
  groupDetails,
  /\b(?:currentGroupDetail|getGroupDetailFromGroupList)\b/,
  'The view must not retain a second detail model or derive member counts from an older joined-group snapshot.',
);
assert.match(groupDetails, /\$\{\s*memberCountDisplay\s*\}\/\$\{maxUsersDisplay\}/s);

console.log('sdk5 group member-count display: PASS');
