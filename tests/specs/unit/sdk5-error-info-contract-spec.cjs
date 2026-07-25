const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.resolve(
  __dirname,
  '../../../src/utils/sdk5ErrorInfo.js',
);

assert.ok(
  fs.existsSync(sourcePath),
  'SDK 5.0 error consumers need a shared message/code/details reader.',
);

const source = fs.readFileSync(sourcePath, 'utf8');
assert.match(source, /error\?\.message/);
assert.match(source, /error\?\.code/);
assert.match(source, /error\?\.details/);
assert.doesNotMatch(source, /\b(?:error|reason|raw)\?*\.(?:msg|reason|error_description|error|type|data)\b/);
assert.match(
  source,
  /\[108, 201, 202\]\.includes\(code\)/,
  'Only token-expired, not-logged-in, and unauthorized errors may clear the IM session.',
);
assert.doesNotMatch(
  source,
  /\[108, 201, 202, 210\]\.includes\(code\)/,
  'Authorization failures must remain on the current page so the raw SDK/server error is visible.',
);
assert.match(
  source,
  /function hasBusinessRejectionReason\(details\)/,
  'Authentication classification must inspect the raw SDK 5.0 error details before redirecting.',
);
assert.match(
  source,
  /reason\.toLowerCase\(\)\.includes\('blacklist'\)/,
  'A chatroom blacklist rejection must not be treated as a login failure even if the SDK maps its ACK to 202.',
);
assert.match(
  source,
  /if \(hasBusinessRejectionReason\(details\)\) return false;[\s\S]*?if \(\[108, 201, 202\]\.includes\(code\)\) return true;/,
  'The raw server rejection reason must take precedence over the mapped SDK error code when deciding whether to clear login state.',
);

console.log('sdk5 error info contract: PASS');
