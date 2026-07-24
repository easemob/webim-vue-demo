const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const listener = fs.readFileSync(
  path.join(root, 'src/IM/listener/imGroupListener.js'),
  'utf8',
);
assert.match(
  listener,
  /onMembersExited:\s*\(payload\)\s*=>\s*\{[\s\S]*?recordGroupEvent\('onMembersExited', payload\);[\s\S]*?refreshGroupMembers\(payload\.groupId\);/,
  'SDK 5.0 exited-members events must retain the original payload and refresh the real member snapshot.',
);
assert.doesNotMatch(
  listener,
  /onMembersExited:[\s\S]*?(?:from|to|operation)\s*:/,
  'SDK 5.0 does not provide an operator for onMembersExited; no V4-shaped notification record may be created.',
);
assert.match(
  listener,
  /console\.log\('\[SDK 5\.0 Group Event\] received', \{\s*eventName,\s*rawEvent: payload,\s*\}\);/s,
  'The console must expose the SDK 5.0 event name and raw payload.',
);
assert.doesNotMatch(listener, /GROUP_OPERATION_TYPE|normalizeSdk5UserIds/);

console.log('sdk5 group members exited: PASS');
