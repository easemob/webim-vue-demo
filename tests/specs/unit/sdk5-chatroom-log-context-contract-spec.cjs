const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');

for (const relativePath of [
  'src/views/Chat/components/Chatroom/ChatroomDetails.vue',
  'src/views/Chat/components/Chatroom/index.vue',
]) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  assert.doesNotMatch(source, /\bfrom:\s*getCurrentUserId\(\)/);
  assert.match(source, /currentUserId:\s*getCurrentUserId\(\)/);
}

console.log('sdk5 chatroom log context contract: PASS');
