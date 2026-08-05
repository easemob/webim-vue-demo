const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const listener = fs.readFileSync(
  path.join(root, 'src/IM/listener/imGroupListener.js'),
  'utf8',
);
const conversation = fs.readFileSync(
  path.join(root, 'src/store/modules/conversation.js'),
  'utf8',
);
const details = fs.readFileSync(
  path.join(root, 'src/views/Chat/components/InformDetails/index.vue'),
  'utf8',
);

assert.match(
  listener,
  /store\.dispatch\('recordSdkEvent', \{[\s\S]*?domain:\s*'group',[\s\S]*?eventName,[\s\S]*?payload,[\s\S]*?receivedAt,[\s\S]*?\}\)/,
);
assert.match(
  listener,
  /store\.dispatch\('createNewInform', \{[\s\S]*?eventName,[\s\S]*?payload,[\s\S]*?domain:\s*'group',[\s\S]*?receivedAt,[\s\S]*?\}\)/,
);
assert.match(conversation, /sdkEventName:\s*eventName/);
assert.match(conversation, /sdkPayload:\s*payload/);
assert.match(details, /record\.eventName/);
assert.match(details, /JSON\.stringify\(record\.payload, null, 2\)/);

console.log('sdk5 group notification payload: PASS');
