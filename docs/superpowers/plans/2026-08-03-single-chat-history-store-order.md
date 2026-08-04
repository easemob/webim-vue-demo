# Single Chat History Store Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each successful WebSDK 5.0 history request write its messages to the current Vuex conversation list before the action resolves to the message page.

**Architecture:** Keep `ChatManager.getHistoryMessages` as the sole history source. The Vuex action continues to preserve raw SDK fields and existing merge behavior, but moves the action-resolution boundary after Store mutation and dependent raw-result processing. A static contract guards the ordering in the action source.

**Tech Stack:** Vue 3, Vuex 4, WebSDK 5.0, Node.js `assert` contract scripts.

## Global Constraints

- Use only WebSDK 5.0 APIs and native fields, including `conversationId`, `conversationType`, `msgServerId`, and `msgLocalId`.
- Preserve actual SDK/server success and error results; do not retry, synthesize, fallback, or introduce WebSDK 4.0 compatibility fields.
- Do not submit, push, or clean unrelated working-tree changes.
- Update `cases_list.md` and `.codex/prompts/superpowers.md` if user-visible demo behavior changes.

---

### Task 1: Guard the history action completion order

**Files:**
- Modify: `tests/specs/unit/sdk5-history-and-unread-contract-spec.cjs`
- Modify: `src/store/modules/message.js:511-597`

**Interfaces:**
- Consumes: `ChatManager.getHistoryMessages(options)` response `{ items, cursor, hasMore }`.
- Produces: `getHistoryMessage` resolves `{ messages, cursor, hasMore }` only after `commit('UPDATE_HISTORY_MESSAGE', { listKey: conversationId, historyMessageList })`.

- [ ] **Step 1: Write the failing test**

Add an assertion that requires the history Store commit to occur before the action resolves:

```js
assert.match(
  messageStore,
  /commit\('UPDATE_HISTORY_MESSAGE',[\s\S]*?resolve\(\{[\s\S]*?messages,[\s\S]*?cursor: nextCursor,[\s\S]*?hasMore,[\s\S]*?\}\);/,
  'History results must be written to the Vuex list before the action resolves to the page.',
);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests/specs/unit/sdk5-history-and-unread-contract-spec.cjs
```

Expected: failure stating that history results must be written before resolution.

- [ ] **Step 3: Write the minimal implementation**

In `getHistoryMessage`, move the existing `resolve` block from before `const reversedMessages = [...messages].reverse()` to after all current successful-response work, including `UPDATE_HISTORY_MESSAGE`, profile processing, receipt handling, and the success diagnostic log:

```js
resolve({
  messages,
  cursor: nextCursor,
  hasMore,
});
```

Add the existing `listKey` and resulting stored count to the success log, without replacing or transforming SDK result fields.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node tests/specs/unit/sdk5-history-and-unread-contract-spec.cjs
```

Expected: `sdk5 history and unread contract: PASS`.

### Task 2: Verify the SDK5 message path remains intact

**Files:**
- Verify: `src/store/modules/message.js`
- Verify: `src/views/Chat/components/Message/index.vue`

**Interfaces:**
- Consumes: Store state at `state.Message.messageList[conversationId]`.
- Produces: original SDK history records consumed directly by `ChatMessageListItem`.

- [ ] **Step 1: Run focused contracts**

```bash
node tests/specs/unit/sdk5-history-and-unread-contract-spec.cjs
node tests/specs/unit/sdk5-message-core-model-contract-spec.cjs
node scripts/sdk5-migration-check.cjs
git diff --check
```

Expected: every contract prints `PASS`, migration check exits `0`, and `git diff --check` prints no whitespace errors.

- [ ] **Step 2: Run the production build**

```bash
npm run build
```

Expected: command exits `0`; existing bundle-size warnings, if any, are recorded as warnings and not treated as a successful live-server reproduction.
