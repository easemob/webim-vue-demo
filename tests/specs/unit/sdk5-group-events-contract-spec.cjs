const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const listenerPath = path.resolve(
  __dirname,
  '../../../src/IM/listener/imGroupListener.js',
);
const source = fs.readFileSync(listenerPath, 'utf8');

// SDK 5.0 dispatches named callbacks with groupId and typed user fields; it
// does not dispatch the v4 onGroupEvent({ operation, id, from }) aggregate.
for (const eventName of [
  'onInvitationReceived',
  'onRequestToJoinReceived',
  'onRequestToJoinAccepted',
  'onRequestToJoinDeclined',
  'onInvitationAccepted',
  'onInvitationDeclined',
  'onUserRemoved',
  'onAutoAcceptInvitationFromGroup',
  'onMembersJoined',
  'onMembersExited',
  'onAdminAdded',
  'onAdminRemoved',
  'onOwnerChanged',
  'onMuteListAdded',
  'onMuteListRemoved',
  'onAllowListAdded',
  'onAllowListRemoved',
  'onAllMemberMuteStateChanged',
  'onAnnouncementChanged',
  'onSharedFileAdded',
  'onSharedFileDeleted',
  'onGroupInfoChanged',
  'onGroupDestroyed',
]) {
  assert.match(source, new RegExp(`${eventName}:\\s*\\(payload\\)`));
}

assert.match(
  source,
  /const normalizeSdk5GroupEvent = \(eventName, payload\) =>/,
  'SDK 5.0 group callback payloads must be adapted at the listener boundary.',
);
assert.match(source, /id: payload\.groupId/);
assert.match(source, /members: normalizeSdk5UserIds\(payload\.members\)/);
assert.match(source, /from: payload\.inviter\?\.userId/);
assert.match(source, /from: payload\.applicant\?\.userId/);
assert.match(source, /to: payload\.administrator\?\.userId/);
assert.match(source, /from: payload\.oldOwner\?\.userId/);
assert.match(source, /to: payload\.newOwner\?\.userId/);
assert.doesNotMatch(source, /\bonGroupEvent\s*:/);

console.log('sdk5 group event contract: PASS');
