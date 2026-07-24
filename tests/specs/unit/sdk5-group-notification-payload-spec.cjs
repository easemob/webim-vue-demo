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

assert.match(listener, /store\.dispatch\('createNewInform', \{ eventName, payload \}\)/);
assert.match(conversation, /sdkEventName:\s*eventName/);
assert.match(conversation, /sdkPayload:\s*payload/);
assert.match(details, /item\.sdkEventName/);
assert.match(details, /JSON\.stringify\(item\.sdkPayload, null, 2\)/);

console.log('sdk5 group notification payload: PASS');
