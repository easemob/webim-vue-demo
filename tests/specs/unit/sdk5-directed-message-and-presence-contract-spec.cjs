const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const inputBox = read(
  'src/views/Chat/components/Message/components/ChatInputBox/index.vue',
);
const directedMessage = read(
  'src/views/Chat/components/Message/components/ChatInputBox/components/DirectedMessage/SendDirectedMessage.vue',
);
const contacts = read('src/store/modules/contacts.js');
const directedDefaults = read('src/utils/directedMessageDefaults.js');

assert.match(
  inputBox,
  /<SendDirectedMessage[\s\S]*:conversationId="routeQueryData\.conversationId"[\s\S]*:conversationType="routeQueryData\.conversationType"/,
);
assert.doesNotMatch(
  inputBox,
  /<SendDirectedMessage[\s\S]*:(targetId|chatType)=/,
);
assert.match(directedMessage, /conversationId:\s*\{[\s\S]*type:\s*String/);
assert.match(directedMessage, /conversationType:\s*\{[\s\S]*type:\s*String/);
assert.doesNotMatch(directedMessage, /\b(targetId|chatType)\b/);
assert.match(
  directedMessage,
  /requireManager\('groupManager'\)\.getGroup\(conversationId\.value\)\.getMembers/,
);
assert.doesNotMatch(directedMessage, /fetchGroupsMemberFromServer/);
assert.match(directedDefaults, /member\.user\?\.userId/);
assert.doesNotMatch(directedDefaults, /member\.(member|owner)/);
assert.match(contacts, /const validUserIds = .*filter\(/s);
assert.match(contacts, /presenceManager\(\)\.subscribePresence\(\{[\s\S]*userIds: userItem/);

console.log('sdk5 directed message and presence contract: PASS');
