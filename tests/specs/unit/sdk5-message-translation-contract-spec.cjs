const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const messageStore = read('src/store/modules/message.js');
const messageItem = read(
  'src/views/Chat/components/Message/components/ChatMessageListItem/index.vue',
);

assert.match(messageStore, /getSupportedTranslationLanguages\(/);
assert.match(messageStore, /translateMessage\(\s*\{/);
assert.match(messageStore, /message,\s*\n\s*targetLanguages/);
assert.doesNotMatch(messageStore, /translateMessage\(\s*\{\s*text\b/);
assert.match(messageStore, /voiceMessageToText\(\s*message\.body/);
assert.doesNotMatch(messageStore, /voiceFileToText\(/);

assert.match(messageItem, /openTranslateMessageDialog/);
assert.match(messageItem, /message_translation_result/);
assert.match(messageItem, /fetchSupportedTranslationLanguages/);
assert.match(messageItem, /translateTextMessage/);
assert.match(messageItem, /convertVoiceMessageToText/);
assert.match(messageItem, /message_voice_to_text_result/);

console.log('sdk5 message translation and voice-to-text contract: PASS');
