const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.resolve(__dirname, '../../../src/store/modules/contacts.js');
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
assert.doesNotMatch(addFriendsSource, /\breason:\s*applyAddFriendsForm\.applyFriendMessage/);
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
assert.match(contactListenerSource, /onContactInvited:\s*\(data\)\s*=>/);
assert.match(
  contactListenerSource,
  /\[SDK5 Contact\] onContactInvited received/,
  'Friend-invitation diagnostics must log the real SDK 5.0 inbound event payload.',
);
assert.match(
  contactListenerSource,
  /onDispatchContactEvent\(\s*CONTACT_OPERATION_CUSTOM_TYPE\.CONTACT_INVITED,\s*data,\s*\)/s,
);
assert.match(
  contactListenerSource,
  /case CONTACT_OPERATION_CUSTOM_TYPE\.CONTACT_INVITED:\s*\{\s*submitInformData\(INFORM_FROM\.FRIEND, data\);/s,
);
assert.match(
  contactListenerSource,
  /case CONTACT_OPERATION_CUSTOM_TYPE\.CONTACT_ADDED:\s*\{\s*submitInformData\(INFORM_FROM\.FRIEND, data\);\s*store\.dispatch\('syncContactsFromSdkSnapshot'\);/s,
  'A confirmed SDK contact-added event must refresh from its real contact snapshot.',
);
assert.match(
  contactListenerSource,
  /case CONTACT_OPERATION_CUSTOM_TYPE\.CONTACT_AGREED:\s*\{\s*submitInformData\(INFORM_FROM\.FRIEND, data\);\s*Promise\.resolve\(store\.dispatch\('syncContactsFromSdkSnapshot'\)\)/s,
  'A confirmed SDK contact-agreed event must refresh from its real contact snapshot.',
);
assert.doesNotMatch(
  contactListenerSource,
  /data\.type\s*=/,
  'SDK 5.0 ContactRosterEventPayload is read-only and must not be rewritten by the Demo.',
);
assert.match(
  source,
  /syncContactsFromSdkSnapshot:\s*async \(\{ dispatch \}\)\s*=>\s*\{\s*await dispatch\('fetchAllContactsListWithRemarkFromServer'\);/s,
  'Contact list refreshes must use the current SDK 5.0 contact snapshot, not event-field guesses.',
);

console.log('sdk5 contacts store contract: PASS');
