const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const contactInfoPath = path.resolve(
  __dirname,
  '../../../src/views/Chat/components/Contacts/components/ContactInfos.vue',
);
const messagePath = path.resolve(
  __dirname,
  '../../../src/views/Chat/components/Message/index.vue',
);

const contactInfoSource = fs.readFileSync(contactInfoPath, 'utf8');
const messageSource = fs.readFileSync(messagePath, 'utf8');

for (const source of [contactInfoSource, messageSource]) {
  assert.match(source, /contactManager\(\)\.addUsersToBlocklist\(\{\s*userIds:\s*\[targetId\]/s);
  assert.match(source, /const result = await contactManager\(\)\.addUsersToBlocklist\(/);
  assert.match(
    source,
    /result\.succeeded\.some\(\(user\) => user\.userId === targetId\)/,
  );
  assert.doesNotMatch(source, /\bEMClient\.(?:addUsersToBlocklist|addFriendToBlackList)/);
  assert.doesNotMatch(source, /setTimeout\(\(\) =>\s*.*fetchBlackList/s);
}

assert.match(
  messageSource,
  /console\.error\('\[Blocklist\] addUsersToBlocklist failed',\s*\{\s*currentUser: getCurrentUserId\(\),\s*targetId,\s*error,\s*\}\s*\)/s,
);
assert.match(
  contactInfoSource,
  /console\.error\('\[Blocklist\] addUsersToBlocklist failed',\s*\{\s*currentUser: getCurrentUserId\(\),\s*targetId,\s*error,\s*\}\s*\)/s,
);

console.log('sdk5 blocklist contract: PASS');
