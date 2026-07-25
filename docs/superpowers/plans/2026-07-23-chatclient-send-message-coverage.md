# ChatClient.sendMessage SDK 5.0 覆盖 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为当前会话的文本消息增加独立的 `ChatClient.sendMessage` SDK 5.0 真实测试入口，并同步覆盖文档与覆盖率。

**Architecture:** 消息继续由 `ChatManager.createTextMessage` 创建为 SDK 5.0 原始 `Message`。现有普通发送继续调用 `ChatManager.sendMessage`；新增按钮调用一个只转发到 `getClient().sendMessage` 的封装，成功后才使用 SDK 回包写入既有消息列表，失败时保留原始错误且绝不回退到 Manager。

**Tech Stack:** Vue 3 `<script setup>`、Vuex、Element Plus、Node `assert` 合约测试、`easemob-websdk 5.0`。

## Global Constraints

- 只使用 WebSDK 5.0 公开 API、字段和事件；禁止 V4 字段、兼容层、双路径或降级逻辑。
- `ChatClient.sendMessage` 失败后禁止调用 `ChatManager.sendMessage`、重试或本地伪造成功。
- 新入口只覆盖当前会话文本消息，不增加图片、文件、语音、视频的 Client 发送入口。
- 保留 SDK 原始成功回包和错误对象到 Console；UI/Store 只消费 SDK 5.0 原始 `Message`。
- 当前工作区已有用户改动；不执行 reset、checkout、clean 或 commit，只编辑本任务文件。
- 同步更新 `cases_list.md`、`.codex/prompts/superpowers.md` 与 `docs/sdk5-api-coverage.md`。

---

### Task 1: 为 `ChatClient.sendMessage` 建立失败回归用例并实现最小发送封装

**Files:**
- Create: `tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs`
- Modify: `src/IM/sdk5/chat.js:1-32`

**Interfaces:**
- Consumes: `getClient(): ChatClient` 和 `ChatClient.sendMessage(message, options?)`。
- Produces: `sendMessageByClient(message, options = {}) => Promise<Message>`；函数只能调用 `getClient().sendMessage(message, options)`。

- [ ] **Step 1: Write the failing test**

```js
const chat = read('src/IM/sdk5/chat.js');

assert.match(chat, /const \{ requireManager, getClient \} = require\('\.\/client'\)/);
assert.match(
  chat,
  /async function sendMessageByClient\(message, options = \{\}\) \{\s*return getClient\(\)\.sendMessage\(message, options\);\s*\}/s,
);
assert.doesNotMatch(
  chat.match(/async function sendMessageByClient[\s\S]*?\n\}/)?.[0] || '',
  /chatManager|requireManager\('chatManager'\)\.sendMessage/,
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs`

Expected: FAIL because `sendMessageByClient` is absent.

- [ ] **Step 3: Write minimal implementation**

```js
const { requireManager, getClient } = require('./client');

async function sendMessageByClient(message, options = {}) {
  return getClient().sendMessage(message, options);
}

module.exports = { createMessage, sendMessage, sendMessageByClient };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs`

Expected: `sdk5 ChatClient.sendMessage contract: PASS`.

### Task 2: 在文本输入区增加独立 Client 发送按钮

**Files:**
- Modify: `src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue:1-280`
- Test: `tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs`

**Interfaces:**
- Consumes: `createMessage('text', options)`、`sendMessage(message, options)`、`sendMessageByClient(message, options)` 和当前 `conversationId` / `conversationType` / `deliverOnlineOnlyOptions` props。
- Produces: `sendTextMessageByClient()`，供 `SDK5 Client.sendMessage` 按钮调用；现有 `sendTextMessage()` 保持 Manager 发送入口。

- [ ] **Step 1: Extend the failing test**

```js
const textMessage = read(
  'src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue',
);

assert.match(textMessage, /import \{ createMessage, sendMessage, sendMessageByClient \} from '@\/IM\/sdk5\/chat';/);
assert.match(textMessage, /const sendTextMessageByClient = _\.debounce\(/);
assert.match(textMessage, /await sendMessageByClient\(messageToSend, \{/);
assert.match(textMessage, />SDK5 Client\.sendMessage<\/el-button>/);
assert.doesNotMatch(
  textMessage.match(/const sendTextMessageByClient[\s\S]*?\}, 50\);/)?.[0] || '',
  /await sendMessage\(/,
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs`

Expected: FAIL because the component neither imports nor invokes `sendMessageByClient`.

- [ ] **Step 3: Write minimal implementation**

```js
const sendTextMessageByClient = _.debounce(async () => {
  // Build the same SDK 5.0 msgOptions as the ordinary text sender.
  const messageToSend = createMessage('text', msgOptions);
  const message = await sendMessageByClient(messageToSend, sendOptions);
  console.log('[Message Send] ChatClient.sendMessage success', {
    conversationId: message.conversationId,
    conversationType: message.conversationType,
    rawMessage: message,
  });
  await store.dispatch('senedShowTypeMessage', message);
}, 50);
```

The implementation must share the existing SDK 5.0 message parameter construction and input validation, write a raw failure log with `error`, and add a second plain button labelled `SDK5 Client.sendMessage`. It must not modify the existing `sendTextMessage` path or introduce a Manager fallback.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs`

Expected: `sdk5 ChatClient.sendMessage contract: PASS`.

### Task 3: 同步文档并重新计算静态 API 覆盖率

**Files:**
- Modify: `docs/sdk5-api-coverage.md:11-15,45`
- Modify: `cases_list.md:15`
- Modify: `.codex/prompts/superpowers.md:118,151`
- Test: `tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs`

**Interfaces:**
- Consumes: 当前覆盖统计基线以 `docs/sdk5-api-coverage.md` 为准，新增 `src/` 中的 `getClient().sendMessage` 调用和真实验证规则。
- Produces: 当前覆盖矩阵按剔除 `@internal` 后的新口径统计为 `145 / 202`、`71.8%`；`ChatClient.sendMessage` 状态为“是”，真实 PASS 仍需真实账号验证。

- [ ] **Step 1: Extend the failing test**

```js
const coverage = read('docs/sdk5-api-coverage.md');
assert.match(coverage, /\| API 覆盖率 \| 71\.8% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 145 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 57 \|/);
assert.match(
  coverage,
  /\| ChatClient 直接发消息 \| `ChatClient\.sendMessage` \| 是 \|/,
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs`

Expected: FAIL because the coverage statistics and API row are still the pre-entry values.

- [ ] **Step 3: Write documentation updates**

Update the coverage row to name the `SDK5 Client.sendMessage` text entry, state that it directly calls `getClient().sendMessage`, and state that real single/group/chatroom verification is pending. Update the totals using the current `@internal`-excluded coverage matrix. Add the same current-conversation text test entry and raw-result/no-fallback rules to the feature list and project prompt.

- [ ] **Step 4: Run documentation contract verification**

Run: `node tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs`

Expected: `sdk5 ChatClient.sendMessage contract: PASS`.

### Task 4: Run focused regression and build verification

**Files:**
- Verify: `src/IM/sdk5/chat.js`
- Verify: `src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue`
- Verify: `tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs`

- [ ] **Step 1: Run focused SDK 5.0 message tests**

Run:

```bash
node tests/specs/unit/sdk5-chatclient-send-contract-spec.cjs
node tests/specs/unit/sdk5-message-core-model-contract-spec.cjs
node tests/specs/unit/sdk5-message-store-contract-spec.cjs
node tests/specs/unit/sdk5-message-route-contract-spec.cjs
```

Expected: all commands exit `0` and print their PASS markers.

- [ ] **Step 2: Scan the changed send path for prohibited fallbacks**

Run:

```bash
rg -n 'ChatClient\.sendMessage|sendMessageByClient|chatManager\(\)\.sendMessage|EMClient|conn|chatType|\bmid\b|\bmsg:' \
  src/IM/sdk5/chat.js \
  src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue
```

Expected: the Client wrapper contains exactly `getClient().sendMessage`; no Client sender path contains `chatManager().sendMessage`, V4 client APIs, or V4 message fields.

- [ ] **Step 3: Run source and build validation**

Run:

```bash
git diff --check
npm run build
```

Expected: both commands exit `0`. Do not delete, stage, or revert pre-existing `dist/` changes produced by the dirty worktree.

- [ ] **Step 4: Record real-verification boundary**

Record the current static coverage from `docs/sdk5-api-coverage.md`; real `ChatClient.sendMessage` verification remains pending until the dedicated button is exercised against real single-chat, group-chat, and chat-room accounts with raw send and receive logs.
