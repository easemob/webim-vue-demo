# Single and Group Chat Receipt Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display one green check for an SDK 5.0 single/group delivery receipt and two green checks for an SDK 5.0 peer-read/group-read receipt, in one sender-only UI position.

**Architecture:** The message component continues to consume native `delivered`, `isPeerRead`, and `groupReadCount` fields. Distinct single-chat and group-chat template branches each choose one final visual state; the existing raw group read count remains visible. The static receipt contract test guards against restoring separate delivery/read indicators.

**Tech Stack:** Vue 3 SFC, SCSS, Node.js built-in test runner.

## Global Constraints

- Use only WebSDK 5.0 fields and callbacks; do not introduce SDK 4.0 mappings, compatibility, fallbacks, or local receipt state.
- `isPeerRead` is an SDK 5.0 outgoing single-chat field; `groupReadCount > 0` is the sole fact for the group two-check state.
- Do not change receipt transport, Store mutation/action behavior, or group/chatroom behavior.
- Synchronize `cases_list.md` and `.codex/prompts/superpowers.md` with the implemented display behavior.

---

### Task 1: Lock the single-chat and group-chat visual contract before implementation

**Files:**
- Modify: `tests/specs/unit/sdk5-read-receipt-display-contract-spec.cjs`

**Interfaces:**
- Consumes: `src/views/Chat/components/Message/components/ChatMessageListItem/index.vue`.
- Produces: source-level contract that requires one sender-only receipt branch for each conversation type and the exact `✓` / `✓✓` progression.

- [ ] **Step 1: Write the failing test**

```js
assert.match(
  messageItem,
  /msgBody\.conversationType\s*===\s*CONVERSATION_TYPE\.SINGLE[\s\S]*msgBody\.delivered[\s\S]*msgBody\.isPeerRead\s*===\s*true[\s\S]*'✓✓'[\s\S]*'✓'/,
  '单聊发送方必须以一个状态槽展示送达一勾、已读两勾',
);
assert.match(
  messageItem,
  /msgBody\.conversationType\s*===\s*CONVERSATION_TYPE\.GROUP[\s\S]*msgBody\.groupReadCount\s*>\s*0[\s\S]*'✓✓'[\s\S]*'✓'/,
  '群聊发送方必须以一个状态槽展示送达一勾、至少一人已读两勾',
);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/specs/unit/sdk5-read-receipt-display-contract-spec.cjs
```

Expected: FAIL because the template currently has separate group delivery and read nodes and does not have a group-chat final-state branch.

- [ ] **Step 3: Write minimal implementation**

Add one sender-only group-chat state node next to the existing single-chat node. Render `✓✓` when the real `groupReadCount > 0`; otherwise render `✓` when `delivered === true`. Preserve the existing `N人已读` text and do not use `isPeerRead` for group messages. Reuse the green text indicator SCSS.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node --test tests/specs/unit/sdk5-read-receipt-display-contract-spec.cjs
```

Expected: PASS with `sdk5 read-receipt display contract: PASS`.

- [ ] **Step 5: Commit**

```bash
git add tests/specs/unit/sdk5-read-receipt-display-contract-spec.cjs \
  src/views/Chat/components/Message/components/ChatMessageListItem/index.vue \
  src/views/Chat/components/Message/components/ChatMessageListItem/index.scss
git commit -m "fix: unify chat receipt indicators"
```

Do not commit from the current dirty worktree unless the user explicitly requests a commit; stage only these paths when a clean commit is authorized.

### Task 2: Synchronize verification documentation and run regression checks

**Files:**
- Modify: `cases_list.md`
- Modify: `.codex/prompts/superpowers.md`

**Interfaces:**
- Consumes: implemented single-chat rendering contract from Task 1.
- Produces: project capability and operating-rule text that describes exact SDK 5.0 source fields and display semantics.

- [ ] **Step 1: Update documentation**

Add one clause stating that single-chat uses `delivered` and real `isPeerRead`, while group-chat uses `delivered` and real `groupReadCount`; both use a green `✓` / `✓✓` progression, and the group count remains visible. State that the receiver does not show receipt icons for that incoming message.

- [ ] **Step 2: Run focused regression checks**

Run:

```bash
node --test \
  tests/specs/unit/sdk5-read-receipt-display-contract-spec.cjs \
  tests/specs/unit/sdk5-single-chat-event-payload-contract-spec.cjs \
  tests/specs/unit/sdk5-message-expanded-capabilities-contract-spec.cjs
git diff --check
```

Expected: all three contract tests PASS; `git diff --check` produces no output.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: exit code 0. Existing bundle-size warnings, if any, are not failures.

- [ ] **Step 4: Commit**

```bash
git add cases_list.md .codex/prompts/superpowers.md
git commit -m "docs: clarify sdk5 single chat receipt indicators"
```

Do not commit from the current dirty worktree unless the user explicitly requests a commit; stage only these paths when a clean commit is authorized.
