const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.resolve(
  __dirname,
  '../../../src/store/modules/contacts.js',
);
const source = fs.readFileSync(sourcePath, 'utf8');
const addFriendsPath = path.resolve(
  __dirname,
  '../../../src/views/Chat/components/NavBar/components/ApplyComponents/addFriends.vue',
);
const addFriendsSource = fs.readFileSync(addFriendsPath, 'utf8');
const contactListenerPath = path.resolve(
  __dirname,
  '../../../src/IM/listener/imContactListener.js',
);
const contactListenerSource = fs.readFileSync(contactListenerPath, 'utf8');

assert.match(source, /requireManager\('contactManager'\)/);
assert.match(source, /requireManager\('presenceManager'\)/);
assert.match(source, /requireManager\('userInfoManager'\)/);
assert.match(source, /contactManager\(\)\.getContacts\(\)/);
assert.match(source, /presenceManager\(\)\.getSubscribedPresenceList/);
assert.doesNotMatch(source, /\bEMClient\b/);

// SDK 5.0 addContact only accepts `message` as the optional invitation text.
assert.match(
  addFriendsSource,
  /const request = \{\s*userId:\s*applyAddFriendsForm\.username,\s*message:\s*applyAddFriendsForm\.applyFriendMessage,\s*\};[\s\S]*?addContact\(request\)/s,
);
assert.doesNotMatch(
  addFriendsSource,
  /\breason:\s*applyAddFriendsForm\.applyFriendMessage/,
);
assert.match(
  addFriendsSource,
  /\[SDK5 Contact\] addContact request/,
  'Friend-invitation diagnostics must log the exact WebSDK 5.0 request boundary.',
);
assert.match(
  addFriendsSource,
  /\[SDK5 Contact\] addContact succeeded/,
  'Friend-invitation diagnostics must log SDK 5.0 request success.',
);
assert.match(
  addFriendsSource,
  /\[SDK5 Contact\] addContact failed/,
  'Friend-invitation diagnostics must preserve the SDK 5.0 request failure.',
);

// Friend requests are notification-driven only: the invited user receives the
// SDK callback and it is forwarded to the notification store without polling.
assert.match(contactListenerSource, /onContactInvited:\s*\(payload\)\s*=>/);
assert.match(
  contactListenerSource,
  /\[SDK 5\.0 Contact Event\] received/,
  'Friend-invitation diagnostics must log the real SDK 5.0 inbound event payload.',
);
assert.match(
  contactListenerSource,
  /store\.dispatch\('recordSdkEvent', \{[\s\S]*?domain:\s*'contact',[\s\S]*?eventName,[\s\S]*?payload,[\s\S]*?currentUserId:\s*getCurrentUserId\(\),[\s\S]*?receivedAt,[\s\S]*?\}\)/,
  'A real contact callback must be recorded in the contact event domain.',
);
assert.match(
  contactListenerSource,
  /store\.dispatch\('createNewInform', \{[\s\S]*?eventName,[\s\S]*?payload,[\s\S]*?domain:\s*'contact',[\s\S]*?receivedAt,[\s\S]*?\}\)/,
  'The contact preview must retain the same raw callback and capture time.',
);
assert.match(
  contactListenerSource,
  /onContactInvited:\s*\(payload\)\s*=>[\s\S]*?submitInformData\('onContactInvited', payload\)/s,
);
assert.match(
  contactListenerSource,
  /onContactAdded:\s*\(payload\)\s*=>[\s\S]*?submitInformData\('onContactAdded', payload\)[\s\S]*?syncContactsFromSdkSnapshot/s,
  'A confirmed SDK contact-added event must refresh from its real contact snapshot.',
);
assert.match(
  contactListenerSource,
  /onContactAgreed:\s*\(payload\)\s*=>[\s\S]*?submitInformData\('onContactAgreed', payload\)[\s\S]*?syncContactsFromSdkSnapshot/s,
  'A confirmed SDK contact-agreed event must refresh from its real contact snapshot.',
);
assert.doesNotMatch(
  contactListenerSource,
  /payload\.(?:from|to)|\bfrom\s*:\s*payload|\bto\s*:\s*payload/,
  'The Demo must not map the original SDK 5.0 contact payload into V4 fields.',
);
assert.match(
  source,
  /syncContactsFromSdkSnapshot:\s*async \(\{ dispatch \}\)\s*=>\s*\{\s*await dispatch\('fetchAllContactsListWithRemarkFromServer'\);/s,
  'Contact list refreshes must use the current SDK 5.0 contact snapshot, not event-field guesses.',
);

console.log('sdk5 contacts store contract: PASS');
