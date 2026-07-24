const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const rolePath = path.join(root, 'src/IM/constant/groupRole.js');
const indexPath = path.join(root, 'src/IM/constant/index.js');

assert.ok(fs.existsSync(rolePath), 'SDK 5.0 group roles require a dedicated constant.');
const roleSource = fs.readFileSync(rolePath, 'utf8');
const indexSource = fs.readFileSync(indexPath, 'utf8');

assert.match(roleSource, /OWNER:\s*'owner'/);
assert.match(roleSource, /ADMIN:\s*'admin'/);
assert.match(roleSource, /MEMBER:\s*'member'/);
assert.doesNotMatch(roleSource, /GROUP_OPERATION_TYPE/);
assert.match(indexSource, /export \* from '\.\/groupRole';/);

console.log('sdk5 group role contract: PASS');
