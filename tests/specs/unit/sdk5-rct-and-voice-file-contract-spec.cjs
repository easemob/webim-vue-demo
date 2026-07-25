const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const diagnostics = read('src/store/modules/sdkDiagnostics.js');
const settings = read(
  'src/views/Chat/components/NavBar/components/PersonalsettingCard/index.vue',
);
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');
const casesList = read('cases_list.md');
const projectRules = read('.codex/prompts/superpowers.md');

assert.match(
  diagnostics,
  /getSelfIdsOnOtherPlatform: async \(\{ commit \}\) => \{[\s\S]*?await client\.getSelfIdsOnOtherPlatform\(\)/,
);
assert.match(
  diagnostics,
  /getUserIdsWithRTCUids: async \(\{ commit \}, \{ rtcUids \}\) => \{[\s\S]*?await client\.getUserIdsWithRTCUids\(rtcUids\)/,
);
assert.match(
  diagnostics,
  /voiceFileToText: async \(\{ commit \}, \{ file, voiceParams \}\) => \{[\s\S]*?await requireManager\('chatManager'\)\.voiceFileToText\(\s*file,\s*voiceParams,?\s*\)/,
);
assert.match(settings, /v-model="rtcUidsInput"/);
assert.match(settings, /@click="getUserIdsWithRTCUids"/);
assert.match(settings, /@click="getSelfIdsOnOtherPlatform"/);
assert.match(settings, /@change="selectVoiceFile"/);
assert.match(settings, /@click="voiceFileToText"/);
assert.match(settings, /store\.dispatch\('SdkDiagnostics\/getUserIdsWithRTCUids', \{ rtcUids \}\)/);
assert.match(settings, /store\.dispatch\('SdkDiagnostics\/getSelfIdsOnOtherPlatform'\)/);
assert.match(settings, /store\.dispatch\('SdkDiagnostics\/voiceFileToText', \{[\s\S]*?file: voiceFileInput\.value,[\s\S]*?voiceParams/);
assert.doesNotMatch(
  settings,
  /if \(!rtcUids\.length \|\| rtcUids\.some\(\(rtcUid\) => !Number\.isFinite\(rtcUid\)\)\)/,
);
assert.doesNotMatch(settings, /if \(!voiceFileInput\.value\)/);
assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 193 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.doesNotMatch(
  coverage,
  /仍未覆盖 `ChatManager\.voiceFileToText`|仍未覆盖动态 `ChatClient\.use` 注册、`ChatClient\.getUserIdsWithRTCUids` RTC UID 反查、`ChatClient\.getSelfIdsOnOtherPlatform`/,
);
assert.match(
  uncovered,
  /`ChatManager\.voiceFileToText`、`ChatClient\.getUserIdsWithRTCUids`、`ChatClient\.getSelfIdsOnOtherPlatform` 已在个人设置以原始 SDK 调用接入/,
);
assert.match(casesList, /`ChatManager\.voiceFileToText\(file, voiceParams\)`/);
assert.match(casesList, /`ChatClient\.getUserIdsWithRTCUids\(rtcUids\)`/);
assert.match(casesList, /`ChatClient\.getSelfIdsOnOtherPlatform\(\)`/);
assert.match(projectRules, /`ChatManager\.voiceFileToText\(file, voiceParams\)`/);
assert.match(projectRules, /`ChatClient\.getUserIdsWithRTCUids\(rtcUids\)`/);
assert.match(projectRules, /`ChatClient\.getSelfIdsOnOtherPlatform\(\)`/);

console.log('sdk5 RTC and voice-file contract: PASS');
