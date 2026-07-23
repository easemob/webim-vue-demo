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
  /const memberCountDisplay = computed\(\(\) => \{[\s\S]*?currentGroupDetail\.value\.memberCount[\s\S]*?getGroupDetailFromGroupList\.value\.memberCount[\s\S]*?\}\);/,
  'Member count must consume the refreshed SDK 5.0 GroupDetail before the joined-group list snapshot.',
);
assert.match(groupDetails, /\$\{\s*memberCountDisplay\s*\}\/\$\{maxUsersDisplay\}/s);

console.log('sdk5 group member-count display: PASS');
