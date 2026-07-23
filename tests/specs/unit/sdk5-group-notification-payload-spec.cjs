const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const listener = fs.readFileSync(
  path.join(root, 'src/IM/listener/imGroupListener.js'),
  'utf8',
);
const createInform = fs.readFileSync(
  path.join(root, 'src/utils/handleSomeData/createInform.js'),
  'utf8',
);
const details = fs.readFileSync(
  path.join(root, 'src/views/Chat/components/InformDetails/index.vue'),
  'utf8',
);

assert.match(listener, /sdk5EventName: eventName,/);
assert.match(listener, /sdk5Payload: payload,/);
assert.match(createInform, /sdk5EventName: informContnet\.sdk5EventName,/);
assert.match(createInform, /sdk5Payload: informContnet\.sdk5Payload,/);
assert.match(details, /item\.sdk5EventName/);
assert.match(details, /JSON\.stringify\(item\.sdk5Payload, null, 2\)/);

console.log('sdk5 group notification payload: PASS');
