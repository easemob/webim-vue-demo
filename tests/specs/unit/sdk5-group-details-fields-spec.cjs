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
  /const groupDetail = computed\(\(\) => \{\s*return store\.getters\.getGroupDetailMap\.get\(groupId\.value\) \|\| \{\};\s*\}\);/s,
  'Group detail views must consume the SDK 5.0 GroupDetail map directly rather than a separate joined-group model.',
);
assert.doesNotMatch(
  details,
  /\b(?:getCurrentUserId|editMyGroupNickNameInput|isEditMyGroupNickname|myGroupNickname|editMyGroupNickName|inTheGroupNickname|setInTheGroupInfo|fetchInTheGroupInfoFromServer)\b/,
  'The group detail view must not retain the removed V4 group-member-profile Store contract, including in disabled template or code comments.',
);
assert.match(members, /const getGroupMemberUserId = \(member\) => member\.user\.userId;/);
assert.doesNotMatch(members, /item\?\.member|item\?\.owner/);
assert.match(members, /groupDetail\.memberCount \?\? '-'/);
assert.doesNotMatch(members, /getGroupMembersList\.length\/\$\{groupDetail\.maxMembers/);

console.log('sdk5 group detail fields: PASS');
