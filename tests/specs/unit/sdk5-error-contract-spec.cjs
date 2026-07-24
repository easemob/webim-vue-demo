const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

for (const relativePath of [
  'src/utils/runtimeErrorNotifier.js',
  'src/utils/handleSomeData/handleSDKErrorNotifi.js',
  'src/IM/sdkError.js',
]) {
  const source = read(relativePath);
  assert.doesNotMatch(source, /\berror\.(?:msg|reason|error_description|error|type|data)\b/);
}

const runtimeNotifier = read('src/utils/runtimeErrorNotifier.js');
const sendNotifier = read('src/utils/handleSomeData/handleSDKErrorNotifi.js');
const sdkError = read('src/IM/sdkError.js');

assert.match(runtimeNotifier, /error\.message/);
assert.match(runtimeNotifier, /error\.code/);
assert.match(runtimeNotifier, /error\.details/);
assert.match(sendNotifier, /error\.code/);
assert.match(sendNotifier, /error\.details/);
assert.match(sdkError, /error\.message/);
assert.match(sdkError, /error\.code/);
assert.match(sdkError, /error\.details/);

console.log('sdk5 error contract: PASS');
