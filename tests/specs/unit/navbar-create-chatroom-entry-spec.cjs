const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const navBar = fs.readFileSync(
  path.join(root, 'src/views/Chat/components/NavBar/index.vue'),
  'utf8',
);

assert.doesNotMatch(
  navBar,
  /showInputModal\('createNewChatroom'\)/,
  'The navigation menu must not expose an unsupported SDK 5.0 chatroom-creation action.',
);
assert.doesNotMatch(navBar, /创建聊天室/);

console.log('navbar create-chatroom entry: PASS');
