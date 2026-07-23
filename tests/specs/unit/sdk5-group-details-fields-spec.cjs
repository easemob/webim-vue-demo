const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const details = fs.readFileSync(
  path.join(root, 'src/views/Chat/components/AboutGroups/GroupsDetails/index.vue'),
  'utf8',
);
const members = fs.readFileSync(
  path.join(
    root,
    'src/views/Chat/components/AboutGroups/GroupsManagement/GroupMembers.vue',
  ),
  'utf8',
);

assert.match(details, /return groupDetail\.ext \|\| '';/);
assert.doesNotMatch(details, /groupDetail\.custom/);
assert.match(
  details,
  /const maxUsersDisplay = computed\(\(\) => \{[\s\S]*?currentGroupDetail\.value\.maxMembers[\s\S]*?getGroupDetailFromGroupList\.value\.maxMembers/s,
  'The detail response must take precedence over the joined-group snapshot.',
);
assert.match(members, /const getGroupMemberUserId = \(item\) => item\?\.userId \|\| '';/);
assert.doesNotMatch(members, /item\?\.member|item\?\.owner/);
assert.match(members, /groupDetail\.memberCount \?\? '-'/);
assert.doesNotMatch(members, /getGroupMembersList\.length\/\$\{groupDetail\.maxMembers/);

console.log('sdk5 group detail fields: PASS');
