const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');
const capabilityMatrix = read('docs/sdk5-capability-matrix.md');
const unsupported = read('docs/sdk5-unsupported-capabilities.md');
const projectRules = read('.codex/prompts/superpowers.md');
const readme = read('README.md');

for (const [name, source] of Object.entries({
  coverage,
  uncovered,
  capabilityMatrix,
  unsupported,
  projectRules,
  readme,
})) {
  assert.match(source, /(?:Web)?SDK 5\.0/, `${name} must identify the WebSDK 5.0 contract.`);
  assert.doesNotMatch(
    source,
    /\b5\.0\.\d+\b/,
    `${name} must use the WebSDK 5.0 documentation standard without a minor version.`,
  );
}

assert.doesNotMatch(
  coverage,
  /声明内容哈希|相较旧的手工|版本对比/,
  'Coverage documentation must describe the WebSDK 5.0 standard without package comparisons.',
);

console.log('sdk5 version documentation standard contract: PASS');
