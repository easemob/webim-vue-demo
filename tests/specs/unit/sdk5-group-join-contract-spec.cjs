const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const joinDialog = fs.readFileSync(
  path.join(
    root,
    'src/views/Chat/components/NavBar/components/ApplyComponents/applyJoinGroups.vue',
  ),
  'utf8',
);
const groupStore = fs.readFileSync(
  path.join(root, 'src/store/modules/groups.js'),
  'utf8',
);

assert.match(
  joinDialog,
  /joinGroup\(\{\s*groupId:\s*applyJoinGroupsForm\.groupId,\s*message:\s*applyJoinGroupsForm\.applyJoinMessage,\s*\}\)/s,
  'SDK 5.0 joinGroup must receive its public groupId and message fields.',
);
assert.doesNotMatch(joinDialog, /\breason\s*:/);
assert.doesNotMatch(joinDialog, /getGroupInfo|getPublicGroupList|groupid|groupname|isPublic/);
assert.doesNotMatch(groupStore, /getPublicGroupList|publicGroupList|publicPagingCursor/);

console.log('sdk5 group join contract: PASS');
