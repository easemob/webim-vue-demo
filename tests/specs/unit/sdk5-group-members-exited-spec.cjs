const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const listener = fs.readFileSync(
  path.join(root, 'src/IM/listener/imGroupListener.js'),
  'utf8',
);
const conversation = fs.readFileSync(
  path.join(root, 'src/store/modules/conversation.js'),
  'utf8',
);

assert.match(
  listener,
  /case 'onMembersExited':[\s\S]*?operation: GROUP_OPERATION_TYPE\.MEMBERS_ABSENCE,[\s\S]*?members: normalizeSdk5UserIds\(payload\.members\)/,
  'SDK 5.0 must preserve the emitted member list for an exited-members event.',
);
assert.doesNotMatch(
  listener,
  /case 'onMembersExited':[\s\S]*?from: normalizeSdk5UserIds\(payload\.members\)\[0\]/,
  'SDK 5.0 does not provide an operator for onMembersExited; a removed member must not be presented as one.',
);
assert.match(
  listener,
  /console\.log\('\[SDK 5\.0 Group Event\] onMembersExited', \{\s*groupId: payload\.groupId,\s*members: payload\.members,\s*rawEvent: payload,\s*\}\);/s,
  'The console must expose the SDK 5.0 exited-members event and its raw payload.',
);
assert.match(
  conversation,
  /\[GROUP_OPERATION_TYPE\.MEMBERS_ABSENCE\]: `\$\{getGroupEventMemberNames\(informContent, getters, '成员'\)\}退出了群组`,/,
  'The group notification must use the SDK 5.0 exited-members semantics without inventing an operator.',
);
assert.doesNotMatch(conversation, /\$\{baseMsg\.fromName\}移除了多个群成员/);

console.log('sdk5 group members exited: PASS');
