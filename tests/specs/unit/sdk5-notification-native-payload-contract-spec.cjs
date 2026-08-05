const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const groupListener = read('src/IM/listener/imGroupListener.js');
const contactListener = read('src/IM/listener/imContactListener.js');
const conversationStore = read('src/store/modules/conversation.js');
const notificationDetails = read(
  'src/views/Chat/components/InformDetails/index.vue',
);
const conversationList = read(
  'src/views/Chat/components/Conversation/components/ConversationList.vue',
);

assert.ok(
  !fs.existsSync(path.join(root, 'src/utils/handleSomeData/createInform.js')),
  'System notifications must not retain the V4-shaped from/to/operation adapter.',
);

assert.match(
  groupListener,
  /store\.dispatch\('createNewInform', \{[\s\S]*?eventName,[\s\S]*?payload,[\s\S]*?domain:\s*'group',[\s\S]*?receivedAt,[\s\S]*?\}\)/,
  'Group notifications must store the named SDK 5.0 event and its original payload.',
);
assert.doesNotMatch(
  groupListener,
  /normalizeSdk5GroupEvent|GROUP_OPERATION_TYPE/,
);
assert.doesNotMatch(groupListener, /\b(?:id|from|to|operation)\s*:/);
assert.doesNotMatch(groupListener, /payload\.from/);

assert.match(
  contactListener,
  /store\.dispatch\('createNewInform', \{[\s\S]*?eventName,[\s\S]*?payload,[\s\S]*?domain:\s*'contact',[\s\S]*?receivedAt,[\s\S]*?\}\)/,
  'Contact notifications must store the named SDK 5.0 event and its original payload.',
);
assert.doesNotMatch(
  contactListener,
  /data\?\.(?:from|to)|\bfrom\s*:\s*data|\bto\s*:\s*data/,
);

assert.match(
  conversationStore,
  /createNewInform:\s*\(\{ commit \}, \{ eventName, payload, domain, receivedAt \}\)\s*=>/,
);
assert.match(conversationStore, /sdkEventName:\s*eventName/);
assert.match(conversationStore, /sdkPayload:\s*payload/);
assert.match(
  conversationStore,
  /receivedAt:\s*Number\.isFinite\(receivedAt\) \? receivedAt : Date\.now\(\)/,
);
assert.doesNotMatch(conversationStore, /createInform/);

assert.match(notificationDetails, /const payload = informData\.sdkPayload/);
assert.match(notificationDetails, /payload\?\.userInfo\?\.userId/);
assert.match(notificationDetails, /payload\?\.groupId/);
assert.doesNotMatch(notificationDetails, /informData\.from|item\.from/);
assert.match(
  notificationDetails,
  /JSON\.stringify\(record\.payload, null, 2\)/,
);
assert.match(conversationList, /lastInformDeatail\.sdkEventName/);
assert.doesNotMatch(conversationList, /lastInformDeatail\.from/);

console.log('sdk5 notification native payload contract: PASS');
