const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const conversation = read('src/store/modules/conversation.js');
const view = read('src/views/Chat/components/InformDetails/index.vue');
const messageListener = read('src/IM/listener/imReciveMessageListener.js');
const readAckListener = read('src/IM/listener/imReadAckListener.js');
const reactionListener = read('src/IM/listener/imReactionListener.js');
const groupListener = read('src/IM/listener/imGroupListener.js');
const chatroomListener = read('src/IM/listener/imChatroomListener.js');
const groupsStore = read('src/store/modules/groups.js');
const logoutView = read('src/views/Chat/components/NavBar/components/Logout.vue');

assert.match(conversation, /sdkEventRecords:\s*\[\]/);
assert.match(conversation, /RECORD_SDK_EVENT/);
assert.match(conversation, /recordSdkEvent/);
assert.match(view, /单聊事件/);
assert.match(view, /群组事件/);
assert.match(view, /聊天室事件/);
for (const [source, domain] of [
  [messageListener, 'singleChat'],
  [readAckListener, 'singleChat'],
  [reactionListener, 'singleChat'],
  [groupListener, 'group'],
  [chatroomListener, 'chatRoom'],
]) {
  assert.match(
    source,
    /recordSdkEvent/,
    `${domain} listener must record only real SDK callback payloads.`,
  );
  assert.match(source, new RegExp(`'${domain}'`));
}
assert.doesNotMatch(
  conversation,
  /sdkEventRecords[\s\S]*?(?:chatType|\bmid\b|\bmsg\b)\s*:/,
  'The event record must not introduce a legacy SDK-shaped payload model.',
);
assert.match(groupsStore, /\[SDK 5\.0 Group\] inviteUsersToGroup success/);
assert.match(
  groupsStore,
  /inviteUsersToGroup success', \{[\s\S]*?groupId,[\s\S]*?userIds,[\s\S]*?currentUser: getCurrentUserId\(\),[\s\S]*?result,/,
);
assert.match(
  logoutView,
  /await logout\(\);[\s\S]*?store\.commit\('CLEAR_SDK_EVENT_RECORDS'\);/,
  'SDK event records must be cleared after a successful logout so they stay within one login period.',
);

console.log('sdk5 event center contract: PASS');
