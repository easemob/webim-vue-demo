const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const listenerPath = path.resolve(
  __dirname,
  '../../../src/IM/listener/imGroupListener.js',
);
const source = fs.readFileSync(listenerPath, 'utf8');

// SDK 5.0 dispatches named callbacks with their original public payloads.
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
  'onGroupDisabledChanged',
  'onGroupMemberAttributeChanged',
  'onUserGroupNamecardUpdated',
]) {
  assert.match(source, new RegExp(`${eventName}:\\s*\\(payload\\)`));
}

assert.match(
  source,
  /onMembersJoined:[\s\S]*?refreshGroupMembers\(payload\.groupId\)/,
  'SDK 5.0 member-join events must refresh the real group-member snapshot.',
);
assert.match(
  source,
  /onMembersExited:[\s\S]*?refreshGroupMembers\(payload\.groupId\)/,
  'SDK 5.0 member-exit events must refresh the real group-member snapshot.',
);
assert.doesNotMatch(source, /\bchatType\b/);
assert.match(source, /store\.dispatch\('createNewInform', \{ eventName, payload \}\)/);
assert.match(
  source,
  /console\.log\('\[SDK 5\.0 Group Event\] received', \{[\s\S]*?eventName,[\s\S]*?groupId: payload\?\.groupId,[\s\S]*?currentUserId: getCurrentUserId\(\),[\s\S]*?rawEvent: payload,/,
  'Every real group event log must include the named event, raw payload, group ID, and current user.',
);
assert.doesNotMatch(source, /normalizeSdk5GroupEvent|GROUP_OPERATION_TYPE/);
assert.doesNotMatch(source, /\b(?:id|from|to|operation)\s*:/);
assert.doesNotMatch(source, /\bonGroupEvent\s*:/);

console.log('sdk5 group event contract: PASS');
