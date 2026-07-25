const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const imEntry = read('src/IM/index.js');

assert.match(
  imEntry,
  /import \{ sdk5Config \} from '\.\/initwebsdk';[\s\S]*initializeClient\(sdk5Config\);/,
  'The IM entry must initialize the SDK 5.0 client directly.',
);
assert.doesNotMatch(
  imEntry,
  /miniCore|\bimClient\b/,
  'The IM entry must not retain the legacy core facade or its client alias.',
);
assert.equal(
  fs.existsSync(path.join(root, 'src/IM/miniCore/index.js')),
  false,
  'The legacy IM core facade must be removed rather than left dormant.',
);

console.log('sdk5 IM entry no legacy core: PASS');
