const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

const sourcePath = path.resolve(__dirname, '../../../src/utils/handleSomeData/handlePresence.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const { code } = babel.transformSync(source, {
  filename: sourcePath,
  presets: [['@babel/preset-env', { modules: 'commonjs' }]],
});
const loadedModule = { exports: {} };
vm.runInNewContext(code, {
  module: loadedModule,
  exports: loadedModule.exports,
  require,
  Object,
});

const normalizePresence = loadedModule.exports.default;
const normalized = normalizePresence({
  publisher: 'sdk5-user',
  statusList: { web: 1, android: 0 },
  ext: 'busy',
  latestTime: 1720000000000,
  expiryTime: 1722592000000,
});

assert.deepEqual(
  JSON.parse(JSON.stringify(normalized)),
  {
    uid: 'sdk5-user',
    expiry: 1722592000000,
    lastTime: 1720000000000,
    statusDetails: [
      { device: 'web', status: 1 },
      { device: 'android', status: 0 },
    ],
    ext: 'busy',
  },
);

const onlineStatusSource = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../src/views/Chat/components/NavBar/components/UserOnlineStatusCard.vue',
  ),
  'utf8',
);
assert.match(
  onlineStatusSource,
  /const option = \{\s*customStatus:\s*statusType,?\s*\};/,
  'SDK 5.0 publishPresence requires customStatus instead of the v4 description field.',
);

console.log('sdk5 presence normalization contract: PASS');
