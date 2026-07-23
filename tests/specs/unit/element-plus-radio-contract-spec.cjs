const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const conversationList = read('src/views/Chat/components/Conversation/components/ConversationList.vue');
const messageSearchDrawer = read('src/views/Chat/components/Message/components/MessageSearchDrawer.vue');

assert.match(
  conversationList,
  /<el-radio\s+[\s\S]*?:value="item\.value"/,
  'Element Plus radio values must use value instead of deprecated label-as-value.',
);
assert.doesNotMatch(
  conversationList,
  /<el-radio\s+[\s\S]*?:label=/,
  'Conversation push-setting radios must not use deprecated label-as-value.',
);
assert.match(messageSearchDrawer, /<el-radio-button\s+:value="true"/);
assert.match(messageSearchDrawer, /<el-radio-button\s+:value="false"/);
assert.doesNotMatch(
  messageSearchDrawer,
  /<el-radio-button\s+:label=/,
  'Element Plus radio buttons must not use deprecated label-as-value.',
);

console.log('element-plus radio contract: PASS');
