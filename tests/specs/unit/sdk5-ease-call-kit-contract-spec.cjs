const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const callMessages = read('src/components/EaseCallKit/utils/callMessages.js');
const component = read('src/components/EaseCallKit/index.vue');
const channel = read('src/components/EaseCallKit/hooks/useManageChannel.js');
const app = read('src/App.vue');
const chatShell = read('src/views/Chat/index.vue');

for (const source of [callMessages, component, channel]) {
  assert.doesNotMatch(
    source,
    /\b(IMClient|EaseIMClient|MsgCreateFn|msgCreateFunc|_setImClient)\b|onTextMessage|onCmdMessage|context\.jid|\.send\(/,
  );
}

assert.match(callMessages, /requireManager\('chatManager'\)/);
assert.match(callMessages, /createTextMessage/);
assert.match(callMessages, /createCmdMessage/);
assert.match(callMessages, /sendMessage/);
assert.match(component, /onMessage:/);
assert.match(component, /getCurrentUserId\(\)/);
assert.match(component, /getClientResource\(\)/);
assert.match(component, /getRTCTokenInfo/);
assert.match(channel, /getCurrentUserId\(\)/);
assert.match(channel, /getClientResource\(\)/);
assert.doesNotMatch(app, /\bcreateInformMessage\b|\bCHAT_TYPE\b|\b(from|to|chatType|msg):/);
assert.doesNotMatch(
  chatShell,
  /\bcreateInformMessage\b|\bCHAT_TYPE\b|\b(from|to|chatType|msg):/,
);

console.log('sdk5 EaseCallKit contract: PASS');
