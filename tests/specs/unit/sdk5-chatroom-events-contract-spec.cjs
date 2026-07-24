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
const casesList = fs.readFileSync(path.resolve(__dirname, '../../../cases_list.md'), 'utf8');
const superpowers = fs.readFileSync(
  path.resolve(__dirname, '../../../.codex/prompts/superpowers.md'),
  'utf8',
);

const chatRoomEvents = [
  'onChatRoomDestroyed',
  'onMembersJoined',
  'onMembersExited',
  'onRemovedFromChatRoom',
  'onMuteListAdded',
  'onMuteListRemoved',
  'onAllowListAdded',
  'onAllowListRemoved',
  'onAllMemberMuteStateChanged',
  'onAdminAdded',
  'onAdminRemoved',
  'onOwnerChanged',
  'onAnnouncementChanged',
  'onChatRoomInfoChanged',
  'onAttributesUpdate',
  'onAttributesRemoved',
];

assert.match(index, /const logChatroomSdkEvent = \(eventName, payload\) =>/);
for (const eventName of chatRoomEvents) {
  assert.match(
    index,
    new RegExp(`${eventName}:\\s*\\(payload\\)\\s*=>\\s*\\{[\\s\\S]*?logChatroomSdkEvent\\('${eventName}', payload\\);`),
    `${eventName} must log the raw SDK 5.0 payload when it fires.`,
  );
}
assert.doesNotMatch(index, /createChatroomEventHandler|CHATROOM_EVENT_OPERATIONS/);
assert.match(members, /payload\.chatRoomId/);
assert.doesNotMatch(members, /normalizedEvent\.roomId/);
assert.equal(
  fs.existsSync(path.resolve(__dirname, '../../../src/utils/chatroomEvents.js')),
  false,
  'legacy aggregate chatroom event adapter must be deleted',
);
assert.match(
  casesList,
  /聊天室全部 16 个 SDK 5\.0 命名事件触发时均在 console 输出事件名、原始 payload、payload\.chatRoomId 与当前用户/,
);
assert.match(
  superpowers,
  /聊天室全部 16 个 SDK 5\.0 命名事件触发时必须直接打印事件名、原始 payload、payload\.chatRoomId 与当前用户/,
);

console.log('sdk5 chatroom events contract: PASS');
