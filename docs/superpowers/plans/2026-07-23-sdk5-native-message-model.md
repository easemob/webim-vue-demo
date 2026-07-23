# SDK5 Native Message Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the message list store and render WebSDK 5.0 Message objects directly so receiver-side edits render immediately without legacy field mapping.

**Architecture:** The message Vuex module indexes messages by `conversationId` and identifies them by `msgServerId` or `msgLocalId`. The message list component renders WebSDK 5.0 `type`, `body`, `sender`, `conversationId`, and `conversationType` directly. `onMessageUpdated` and `onMessageRecalled` update the same stored Message object using their public SDK 5.0 payload fields.

**Tech Stack:** Vue 3, Vuex 4, JavaScript, `easemob-websdk` 5.0.1, Node assert contract tests.

## Global Constraints

- Use only WebSDK 5.0 APIs, types, parameters, message fields, and event payloads.
- Do not retain, introduce, or restore WebSDK 4.0 code, field names, compatibility shims, fallback behavior, dual-SDK paths, or downgrade logic.
- Preserve and surface missing or malformed WebSDK 5.0 data as real SDK/server evidence.
- Do not modify existing unrelated worktree changes or generated `dist/` output.

---

### Task 1: Define Native Message Store Contract

**Files:**
- Modify: `src/store/modules/message.js`
- Create: `tests/specs/unit/sdk5-native-message-store-contract-spec.cjs`

**Interfaces:**
- Consumes: WebSDK 5.0 `Message` with `msgServerId`, `msgLocalId`, `conversationId`, `conversationType`, `type`, `body`, `sender`, `ext`, and `modifiedInfo`.
- Produces: Vuex message lists indexed by `conversationId`; edit and recall mutation payloads keyed by `messageId` and `conversationId`.

- [ ] **Step 1: Write the failing contract test**

```js
assert.match(messageStore, /const getSdk5MessageId = \(message\) =>\s*message\?\.msgServerId \|\| message\?\.msgLocalId;/s);
assert.match(messageStore, /const conversationKey = message\.conversationId;/);
assert.doesNotMatch(messageStore, /message\.msg|message\.chatType|message\.to|message\.from/);
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/specs/unit/sdk5-native-message-store-contract-spec.cjs`

Expected: FAIL because the current store uses `id`, `msg`, `to`, and `chatType`.

- [ ] **Step 3: Replace message-store indexing and mutation lookup**

```js
const getSdk5MessageId = (message) =>
  message?.msgServerId || message?.msgLocalId;

const findSdk5Message = (state, conversationId, messageId) =>
  state.messageList[conversationId]?.find(
    (message) => getSdk5MessageId(message) === messageId,
  );
```

Store raw SDK 5.0 messages. For edits assign only `body`, `ext`, and `modifiedInfo`; for recalls set `isRecalled` on the matching raw message.

- [ ] **Step 4: Run the test and verify pass**

Run: `node tests/specs/unit/sdk5-native-message-store-contract-spec.cjs`

Expected: `sdk5 native message store contract: PASS`.

### Task 2: Render SDK5 Text Messages Directly

**Files:**
- Modify: `src/views/Chat/components/Message/components/ChatMessageListItem/index.vue`
- Modify: `tests/specs/unit/sdk5-native-message-store-contract-spec.cjs`

**Interfaces:**
- Consumes: Raw SDK 5.0 Message from Task 1.
- Produces: Text message content rendered from `message.body.content`; sender rendered from `message.sender.userId`; no `msg`, `txt`, `to`, `from`, or `chatType` reads in the text path.

- [ ] **Step 1: Extend the failing contract test**

```js
assert.match(component, /msgBody\.type === 'text'/);
assert.match(component, /msgBody\.body\.content/);
assert.match(component, /msgBody\.sender\.userId/);
assert.doesNotMatch(textBlock, /msgBody\.msg|msgBody\.from|msgBody\.chatType/);
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/specs/unit/sdk5-native-message-store-contract-spec.cjs`

Expected: FAIL because the component renders the legacy normalized message fields.

- [ ] **Step 3: Replace the text-message rendering block**

```vue
<p v-if="msgBody.type === 'text'" style="padding: 10px; line-height: 20px">
  {{ msgBody.body.content }}
  <sup v-if="msgBody.modifiedInfo?.operationCount">(已编辑)</sup>
</p>
```

Use `msgBody.sender.userId` for sender identity and `msgBody.conversationType` for conversation-dependent UI decisions.

- [ ] **Step 4: Run the test and verify pass**

Run: `node tests/specs/unit/sdk5-native-message-store-contract-spec.cjs`

Expected: `sdk5 native message store contract: PASS`.

### Task 3: Connect Native SDK5 Events and History

**Files:**
- Modify: `src/IM/listener/imReciveMessageListener.js`
- Modify: `src/store/modules/message.js`
- Modify: `tests/specs/unit/sdk5-edit-event-contract-spec.cjs`
- Modify: `tests/specs/unit/sdk5-recall-event-contract-spec.cjs`

**Interfaces:**
- Consumes: `onMessage`, `onMessageUpdated`, and `onMessageRecalled` WebSDK 5.0 payloads.
- Produces: Raw messages in the store and immediate receiver-side updates for `singleChat`, `groupChat`, and `chatRoom`.

- [ ] **Step 1: Extend failing event tests**

```js
assert.match(editHandler, /message: updatedMessage/);
assert.match(messageStore, /res\.body = payload\.message\.body;/);
assert.match(recallHandler, /conversationId, conversationType/);
assert.doesNotMatch(listener, /normalizeSdk5Message/);
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node tests/specs/unit/sdk5-edit-event-contract-spec.cjs && node tests/specs/unit/sdk5-recall-event-contract-spec.cjs`

Expected: FAIL because the listener still invokes the legacy message adapter for incoming messages.

- [ ] **Step 3: Store SDK5 messages unchanged and update by locator**

```js
onMessage(message) {
  store.dispatch('createNewMessage', message);
}

onMessageUpdated({ messageId, conversationId, conversationType, message }) {
  store.commit('CHANGE_MESSAGE_BODAY', {
    type: CHANGE_MESSAGE_BODAY_TYPE.MODIFY,
    messageId,
    conversationId,
    conversationType,
    message,
  });
}
```

For history, commit `res.items` without `normalizeSdk5Messages`.

- [ ] **Step 4: Run tests and verify pass**

Run: `node tests/specs/unit/sdk5-edit-event-contract-spec.cjs && node tests/specs/unit/sdk5-recall-event-contract-spec.cjs && node tests/specs/unit/sdk5-native-message-store-contract-spec.cjs`

Expected: all PASS.

### Task 4: Remove Legacy Message Adapter and Verify

**Files:**
- Modify: `src/IM/sdk5/messageAdapter.js`
- Modify: all message-path imports identified by `rg -n "normalizeSdk5Message|normalizeSdk5Messages|toSdk5CombineMessage" src`
- Modify: `cases_list.md`

**Interfaces:**
- Consumes: SDK5 Message objects only.
- Produces: No message-path dependency on legacy field conversion.

- [ ] **Step 1: Write failure checks**

```js
assert.doesNotMatch(messagePathSource, /normalizeSdk5Message|normalizeSdk5Messages/);
assert.doesNotMatch(messagePathSource, /\b(msg|mid|to|from|chatType)\b/);
```

- [ ] **Step 2: Run checks and verify failure**

Run: `node tests/specs/unit/sdk5-native-message-store-contract-spec.cjs`

Expected: FAIL until every message-path adapter import and legacy field read is removed.

- [ ] **Step 3: Remove adapter use and document scope**

Delete message-path adapter imports and calls. Update `cases_list.md` to state that text, real-time edit, and real-time recall are verified through raw WebSDK 5.0 Message data; record other message body rendering as pending native migration if it remains unimplemented.

- [ ] **Step 4: Run full targeted verification**

Run:

```bash
node tests/specs/unit/sdk5-native-message-store-contract-spec.cjs
node tests/specs/unit/sdk5-edit-event-contract-spec.cjs
node tests/specs/unit/sdk5-recall-event-contract-spec.cjs
node tests/specs/unit/sdk5-reaction-contract-spec.cjs
node tests/specs/unit/sdk5-groups-store-contract-spec.cjs
node tests/specs/unit/sdk5-contacts-store-contract-spec.cjs
npm run build
```

Expected: every contract test reports PASS and the build exits 0.

### Task 5: Review and Commit

**Files:**
- Review: `AGENTS.md`, `cases_list.md`, message-path source files, targeted tests

- [ ] **Step 1: Inspect the final diff**

Run: `git diff --check && git diff --stat`

Expected: no whitespace errors and no unrelated source changes.

- [ ] **Step 2: Inspect all legacy references in the native message path**

Run: `rg -n "\.msg\b|\.mid\b|\.to\b|\.from\b|\.chatType\b|normalizeSdk5Message" src/IM/listener/imReciveMessageListener.js src/store/modules/message.js src/views/Chat/components/Message/components/ChatMessageListItem/index.vue`

Expected: no message-path legacy references.

- [ ] **Step 3: Commit after explicit user approval**

```bash
git add AGENTS.md cases_list.md src/IM src/store/modules/message.js src/views/Chat/components/Message/components/ChatMessageListItem/index.vue tests/specs/unit docs/superpowers
git commit -m "refactor: use native sdk5 message model"
```
