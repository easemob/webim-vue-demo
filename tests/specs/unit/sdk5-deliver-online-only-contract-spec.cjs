const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../../..');
const read = (relativePath) =>
  fs.readFileSync(path.resolve(projectRoot, relativePath), 'utf8');

const deliverOnlineOnlyUtil = read('src/utils/deliverOnlineOnly.js');
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');

assert.match(
  deliverOnlineOnlyUtil,
  /export const DELIVER_ONLINE_ONLY_VALUE = true;/,
  'SDK 5.0 deliverOnlineOnly must be boolean true, not the string "true".',
);
assert.doesNotMatch(
  deliverOnlineOnlyUtil,
  /DELIVER_ONLINE_ONLY_VALUE\s*=\s*['"]true['"]/,
  'SDK 5.0 does not treat string "true" as a boolean deliverOnlineOnly flag.',
);

const sendingEntryFiles = [
  'src/views/Chat/components/Message/components/ChatInputBox/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/SendExtMessage.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/ImageMessage/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/FileMessage/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/VideoMessage/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/CmdMessage/index.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/CustomMessage/SendCustomMessage.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/CustomMessage/ShareUserCard.vue',
  'src/views/Chat/components/Message/components/ChatInputBox/components/DirectedMessage/SendDirectedMessage.vue',
  'src/views/Chat/components/Message/components/suit/previewSendImg.vue',
];

for (const relativePath of sendingEntryFiles) {
  const source = read(relativePath);
  const sendCalls = source.match(/sendMessage(?:ByClient)?\([\s\S]*?\);/g) || [];
  for (const sendCall of sendCalls) {
    assert.doesNotMatch(
      sendCall,
      /deliverOnlineOnlyOptions\.value/,
      `${relativePath} must not pass deliverOnlineOnly through sendMessage options; SDK 5.0 reads it from Message.`,
    );
  }

  const createCalls = [...source.matchAll(/createMessage\(\s*['"][a-z]+['"]\s*,/g)];
  for (const createCall of createCalls) {
    const beforeCreate = source.slice(Math.max(0, createCall.index - 2000), createCall.index);
    assert.match(
      beforeCreate,
      /deliverOnlineOnlyOptions\.value/,
      `${relativePath} createMessage call at offset ${createCall.index} must merge deliverOnlineOnlyOptions into message params before creating the SDK 5.0 Message.`,
    );
  }
}

for (const [documentName, documentSource] of [
  ['cases_list.md', casesList],
  ['.codex/prompts/superpowers.md', superpowers],
]) {
  assert.match(
    documentSource,
    /deliverOnlineOnly: true/,
    `${documentName} must record that SDK 5.0 only-online sending uses boolean deliverOnlineOnly on Message.`,
  );
  assert.match(
    documentSource,
    /sendMessage[\s\S]{0,80}options/,
    `${documentName} must record that deliverOnlineOnly is not sent through sendMessage options.`,
  );
}

console.log('sdk5 deliver online only contract: PASS');
