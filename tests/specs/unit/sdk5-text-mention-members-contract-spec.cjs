const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../..',
    'src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue',
  ),
  'utf8',
);

assert.match(
  source,
  /if \(mentionConversationTypeSnapshot === CONVERSATION_TYPE\.GROUP\) \{[\s\S]*store\.dispatch\('fetchGroupsMemberFromServer', \{[\s\S]*groupId: mentionConversationIdSnapshot,[\s\S]*\}\)/,
  'Only a group conversation may load mention candidates through the Group store.',
);
assert.match(
  source,
  /requireManager\('chatRoomManager'\)\s*\.getChatRoom\(chatRoomId\)\s*\.getMembers\(\{[\s\S]*cursor,[\s\S]*pageSize: 50,[\s\S]*\}\)/,
  'A chat-room conversation must load mention candidates through SDK 5.0 ChatRoom.getMembers.',
);
assert.match(
  source,
  /member\.user\?\.userId/,
  'Mention candidates must read the native SDK 5.0 member user ID.',
);
assert.match(
  source,
  /if \(mentionConversationTypeSnapshot === CONVERSATION_TYPE\.CHATROOM\) \{[\s\S]*console\.error\('\[SDK 5\.0 ChatRoom\] getMembers failed',[\s\S]*chatRoomId: mentionConversationIdSnapshot,[\s\S]*error,[\s\S]*\}\);/,
  'A real ChatRoom.getMembers failure must retain the raw SDK error with chat-room context.',
);
assert.doesNotMatch(source, /\.(?:owner|member)\b/);

console.log('sdk5 text mention members contract: PASS');
