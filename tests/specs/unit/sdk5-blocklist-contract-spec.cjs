const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const contactInfoPath = path.resolve(
  __dirname,
  '../../../src/views/Chat/components/Contacts/components/ContactInfos.vue',
);
const messagePath = path.resolve(
  __dirname,
  '../../../src/views/Chat/components/Message/index.vue',
);
const singleChatDetailsPath = path.resolve(
  __dirname,
  '../../../src/views/Chat/components/Message/components/SingleChatDetails.vue',
);
const contactsStorePath = path.resolve(
  __dirname,
  '../../../src/store/modules/contacts.js',
);
const casesListPath = path.resolve(__dirname, '../../../cases_list.md');
const superpowersPath = path.resolve(
  __dirname,
  '../../../.codex/prompts/superpowers.md',
);

const contactInfoSource = fs.readFileSync(contactInfoPath, 'utf8');
const messageSource = fs.readFileSync(messagePath, 'utf8');
const singleChatDetailsSource = fs.readFileSync(singleChatDetailsPath, 'utf8');
const contactsStoreSource = fs.readFileSync(contactsStorePath, 'utf8');
const casesList = fs.readFileSync(casesListPath, 'utf8');
const superpowers = fs.readFileSync(superpowersPath, 'utf8');

for (const source of [contactInfoSource]) {
  assert.match(source, /contactManager\(\)\.addUsersToBlocklist\(\{\s*userIds:\s*\[targetId\]/s);
  assert.match(source, /const result = await contactManager\(\)\.addUsersToBlocklist\(/);
  assert.match(
    source,
    /result\.succeeded\.some\(\(user\) => user\.userId === targetId\)/,
  );
  assert.doesNotMatch(source, /\bEMClient\.(?:addUsersToBlocklist|addFriendToBlackList)/);
  assert.doesNotMatch(source, /setTimeout\(\(\) =>\s*.*fetchBlackList/s);
}

assert.match(
  messageSource,
  /const singleChatTargetUserId = computed\(\(\) => \{/,
  'Message drawer must resolve a dedicated SDK 5.0 target userId instead of treating conversationId as a contact userId.',
);
assert.match(
  messageSource,
  /const targetId = singleChatTargetUserId\.value;/,
  'Message drawer blocklist mutations must use the resolved target userId.',
);
assert.match(
  messageSource,
  /contactManager\(\)\.addUsersToBlocklist\(\{\s*userIds:\s*\[targetId\]/s,
);
assert.match(messageSource, /const result = await contactManager\(\)\.addUsersToBlocklist\(/);
assert.match(
  messageSource,
  /result\.succeeded\.some\(\(user\) => user\.userId === targetId\)/,
);
assert.doesNotMatch(
  messageSource,
  /:user-id="routeQueryData\.conversationId"/,
  'SingleChatDetails must not display the SDK session id as a contact userId.',
);
assert.doesNotMatch(
  messageSource,
  /const targetId = routeQueryData\.value\.conversationId;[\s\S]{0,300}addUsersToBlocklist/,
  'Message drawer must not pass routeQueryData.conversationId directly to ContactManager.addUsersToBlocklist.',
);
assert.doesNotMatch(
  messageSource,
  /const targetId = routeQueryData\.value\.conversationId;[\s\S]{0,300}removeUserFromBlocklist/,
  'Message drawer must not pass routeQueryData.conversationId directly to ContactManager.removeUserFromBlocklist.',
);
assert.doesNotMatch(messageSource, /\bEMClient\.(?:addUsersToBlocklist|addFriendToBlackList)/);
assert.doesNotMatch(messageSource, /setTimeout\(\(\) =>\s*.*fetchBlackList/s);
assert.match(
  singleChatDetailsSource,
  /:conversation-id="conversationId"/,
  'SingleChatDetails must keep DND bound to SDK 5.0 conversationId instead of the contact userId.',
);
assert.match(
  singleChatDetailsSource,
  /contactActionUnavailable/,
  'SingleChatDetails must surface the real missing-userId state instead of emitting ContactManager actions.',
);
assert.match(
  singleChatDetailsSource,
  /const onBlocklistSwitchChange = \(nextValue\) =>/,
  'The blocklist switch must have an explicit event handler instead of relying on parent click bubbling.',
);
assert.match(
  singleChatDetailsSource,
  /@update:model-value="onBlocklistSwitchChange"/,
  'The blocklist switch must dispatch its actual requested value.',
);
assert.match(
  singleChatDetailsSource,
  /@click\.stop/,
  'The switch click must not bubble and submit the blocklist mutation twice.',
);

assert.match(
  messageSource,
  /console\.log\('\[Blocklist\] addUsersToBlocklist request',/,
  'The add request must be visible in the browser console with its SDK 5.0 parameters.',
);
assert.match(
  messageSource,
  /console\.log\('\[Blocklist\] addUsersToBlocklist response',[\s\S]*?result,/,
  'The raw SDK 5.0 BlocklistAddResult must be logged before reporting success.',
);
assert.match(
  messageSource,
  /console\.log\('\[Blocklist\] addUsersToBlocklist verification',/,
  'The post-mutation SDK blocklist snapshot must be logged as the final success evidence.',
);
assert.match(
  contactsStoreSource,
  /fetchBlackList:\s*async \(\{ commit \}\) => \{[\s\S]*?const users = await contactManager\(\)\.getBlocklist\(\);[\s\S]*?return users;[\s\S]*?catch \(error\) \{[\s\S]*?throw error;/,
  'A getBlocklist failure must reach the mutation caller so it cannot be mistaken for a verified success.',
);

assert.match(
  messageSource,
  /console\.error\('\[Blocklist\] addUsersToBlocklist failed',\s*\{\s*currentUser: getCurrentUserId\(\),\s*conversationId: routeQueryData\.value\.conversationId,\s*targetId,\s*error,\s*\}\s*\)/s,
);
assert.match(
  contactInfoSource,
  /console\.error\('\[Blocklist\] addUsersToBlocklist failed',\s*\{\s*currentUser: getCurrentUserId\(\),\s*targetId,\s*error,\s*\}\s*\)/s,
);
assert.match(
  casesList,
  /备注、删除联系人、加入\/移出黑名单只使用 SDK 5\.0 明确解析出的用户 ID，`conversationId` 仅作为会话 ID 展示和用于会话免打扰\/清消息，未解析到用户 ID 时展示真实原因并停止调用联系人 API/,
);
assert.match(
  superpowers,
  /禁止把 `conversationId` 当作联系人 `userId` 传给 ContactManager；未解析到用户 ID 时必须展示真实原因和 console 上下文，并停止调用联系人 API/,
);

console.log('sdk5 blocklist contract: PASS');
