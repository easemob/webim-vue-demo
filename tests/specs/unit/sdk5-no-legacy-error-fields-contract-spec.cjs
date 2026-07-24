const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const files = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collect(filePath);
    } else if (/\.(?:js|vue|ts)$/.test(entry.name)) {
      files.push(filePath);
    }
  }
}

collect(path.join(root, 'src'));

const legacyFields = /\b(?:error|reason|raw)\?*\.(?:msg|reason|error_description|error|type|data)\b/;
for (const filePath of files) {
  const source = fs.readFileSync(filePath, 'utf8');
  assert.doesNotMatch(
    source,
    legacyFields,
    `SDK 5.0 runtime code must not consume legacy error fields: ${path.relative(root, filePath)}`,
  );
}

console.log('sdk5 no legacy error fields contract: PASS');
