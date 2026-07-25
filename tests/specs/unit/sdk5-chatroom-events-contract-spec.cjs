const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const index = fs.readFileSync(
  path.resolve(__dirname, '../../../src/views/Chat/components/Chatroom/index.vue'),
  'utf8',
);
const listenerIndex = fs.readFileSync(
  path.resolve(__dirname, '../../../src/IM/listener/index.js'),
  'utf8',
);
const listenerPath = path.resolve(
  __dirname,
  '../../../src/IM/listener/imChatroomListener.js',
);

assert.equal(
  fs.existsSync(listenerPath),
  true,
  'Chatroom events must stay registered in the global listener lifecycle.',
);
const listener = fs.readFileSync(listenerPath, 'utf8');
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
const eventDeclaration = fs.readFileSync(
  path.resolve(__dirname, '../../../node_modules/easemob-websdk/dist/types/chatroom.d.ts'),
  'utf8',
);

const eventDeclarationBlock = eventDeclaration.slice(
  eventDeclaration.indexOf('export declare const ChatRoomEventName'),
  eventDeclaration.indexOf('/**', eventDeclaration.indexOf('export declare const ChatRoomEventName')),
);
const chatRoomEvents = Array.from(
  eventDeclarationBlock.matchAll(/readonly\s+\w+:\s+"([^"]+)";/g),
  ([, eventName]) => eventName,
);

assert.equal(chatRoomEvents.length, 16, 'Current WebSDK 5.0 declares 16 chatroom events.');

assert.match(
  listenerIndex,
  /import \{ imChatroomListener \} from '\.\/imChatroomListener';/,
);
assert.match(
  listenerIndex,
  /const \{ mountChatroomEventListener \} = imChatroomListener\(\);[\s\S]*?mountSafe\('imChatroomListener', mountChatroomEventListener\);/,
);
assert.match(listener, /const CHATROOM_EVENT_HANDLER_ID = 'chatroomEvent';/);
assert.match(
  listener,
  /manager\.removeEventHandler\(CHATROOM_EVENT_HANDLER_ID\);[\s\S]*?manager\.addEventHandler\(\s*CHATROOM_EVENT_HANDLER_ID,/,
  'The global listener must remove the same handler ID before every registration.',
);
assert.match(
  listener,
  /console\.log\('\[SDK 5\.0 ChatRoom Event\] received', \{[\s\S]*?handlerId: CHATROOM_EVENT_HANDLER_ID,[\s\S]*?eventName,[\s\S]*?chatRoomId: payload\?\.chatRoomId,[\s\S]*?currentUserId: getCurrentUserId\(\),[\s\S]*?rawEvent: payload,[\s\S]*?\}\);/,
  'Every global chatroom event log must retain handler, event, room, current-user, and raw SDK payload context.',
);
for (const eventName of chatRoomEvents) {
  assert.match(
    listener,
    new RegExp(`${eventName}:\\s*\\(payload\\)\\s*=>\\s*recordChatroomEvent\\('${eventName}', payload\\)`),
    `${eventName} must be globally registered and logged with its raw SDK 5.0 payload.`,
  );
}
assert.doesNotMatch(listener, /createChatroomEventHandler|CHATROOM_EVENT_OPERATIONS/);
assert.doesNotMatch(index, /setupChatroomEventHandler|logChatroomSdkEvent|addEventHandler\('CHATROOM'/);
assert.match(members, /payload\.chatRoomId/);
assert.doesNotMatch(members, /normalizedEvent\.roomId/);
assert.equal(
  fs.existsSync(path.resolve(__dirname, '../../../src/utils/chatroomEvents.js')),
  false,
  'legacy aggregate chatroom event adapter must be deleted',
);
assert.match(
  casesList,
  /聊天室全部 16 个 SDK 5\.0 命名事件触发时均在 console 输出 handlerId、事件名、原始 rawEvent、payload\.chatRoomId 与当前用户/,
);
assert.match(
  superpowers,
  /聊天室全部 16 个 SDK 5\.0 命名事件必须在登录后由全局 `ChatRoomManager\.addEventHandler` 注册；触发时直接打印 handlerId、事件名、原始 rawEvent、payload\.chatRoomId 与当前用户/,
);

console.log('sdk5 chatroom events contract: PASS');
