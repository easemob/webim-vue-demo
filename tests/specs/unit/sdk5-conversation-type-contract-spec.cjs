const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

for (const relativePath of [
  'src/IM/constant/index.js',
  'src/constant/messageType.js',
  'src/store/modules/message.js',
  'src/store/modules/groups.js',
  'src/store/modules/conversation.js',
  'src/views/Chat/components/Conversation/components/ConversationList.vue',
]) {
  assert.doesNotMatch(read(relativePath), /\bCHAT_TYPE\b/);
}

const groupStore = read('src/store/modules/groups.js');
assert.doesNotMatch(groupStore, /\bchatType\b/);
assert.match(groupStore, /fetchGroupsMemberFromServer:[\s\S]*\{ groupId \}/);

console.log('sdk5 conversation type contract: PASS');
