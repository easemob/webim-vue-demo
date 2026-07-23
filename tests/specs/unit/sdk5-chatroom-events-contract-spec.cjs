const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const index = fs.readFileSync(
  path.resolve(__dirname, '../../../src/views/Chat/components/Chatroom/index.vue'),
  'utf8',
);
const members = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/Chatroom/ChatroomMemberManagement.vue',
  ),
  'utf8',
);

assert.match(index, /onChatRoomDestroyed:/);
assert.match(index, /onRemovedFromChatRoom:/);
assert.match(index, /onMembersJoined:/);
assert.doesNotMatch(index, /createChatroomEventHandler|CHATROOM_EVENT_OPERATIONS/);
assert.match(members, /payload\.chatRoomId/);
assert.doesNotMatch(members, /normalizedEvent\.roomId/);
assert.equal(
  fs.existsSync(path.resolve(__dirname, '../../../src/utils/chatroomEvents.js')),
  false,
  'legacy aggregate chatroom event adapter must be deleted',
);

console.log('sdk5 chatroom events contract: PASS');
