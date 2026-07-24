const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const sourceRoot = path.join(root, 'src');
const files = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (filePath.includes(`${path.sep}styles${path.sep}iconfont`)) continue;
      collect(filePath);
    } else if (/\.(?:js|vue|ts)$/.test(entry.name)) {
      files.push(filePath);
    }
  }
}

collect(sourceRoot);

for (const filePath of files) {
  const source = fs.readFileSync(filePath, 'utf8');
  assert.doesNotMatch(
    source,
    /\b(?:sdk4|v4|legacy|EMClient|conn)\b/i,
    `SDK 5.0 runtime must not retain a V4 identifier: ${path.relative(root, filePath)}`,
  );
  assert.doesNotMatch(
    source,
    /@internal/,
    `SDK 5.0 runtime must not call an SDK internal API: ${path.relative(root, filePath)}`,
  );
}

console.log('sdk5 runtime exclusivity contract: PASS');
