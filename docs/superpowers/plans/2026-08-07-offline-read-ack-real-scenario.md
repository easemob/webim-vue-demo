# 离线消息 Read ACK 真实场景 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 记录并展示 WebSDK 5.0 真正下发的离线同步事件及 `Message.isOnline`，让离线消息在用户实际查看后走既有的真实 Read ACK 调用链。

**Architecture:** `imConnectListener.js` 负责公开 `ChatClient` 的无载荷离线同步事件，并写进具有独立筛选项的事件中心。`imReciveMessageListener.js` 和消息项只直接消费 SDK `Message.isOnline`；`Message/index.vue` 到 `message.js` 的渲染后 Read ACK API 保持唯一调用路径，发送方仍由 `imReadAckListener.js` 的真实回调更新状态。

**Tech Stack:** Vue 3 Composition API、Vuex、Element Plus、Node.js `node:assert` 静态契约、WebSDK 5.0.7。

## Global Constraints

- 只能使用公开 WebSDK 5.0 `onOfflineMessageSyncStart`、`onOfflineMessageSyncFinish`、`Message.isOnline` 与 `ChatManager.sendMessageReadReceipts`。
- `isOnline === false` 是唯一可显示“离线同步消息”的条件；字段缺失或为 `true` 时不推断离线。
- Read ACK 仅来自已完成渲染的、真实 `direct: 'RECEIVE'`、`needReadReceipt: true`、有 `msgServerId` 的单聊/群聊消息。
- 不增加 SDK 4.0、REST、自动重试、本地伪造回执、模拟离线入口或聊天室 Read ACK。
- 同步 `cases_list.md` 和 `.codex/prompts/superpowers.md`；按用户要求不提交、不推送，也不覆盖其他未提交改动。

---

### Task 1: 离线同步可观测性的失败契约

**Files:**
- Create: `tests/specs/unit/sdk5-offline-read-receipt-contract-spec.cjs`
- Test: `tests/specs/unit/sdk5-offline-read-receipt-contract-spec.cjs`

**Interfaces:**
- Consumes: `imConnectListener.js` 的 `ChatClient.addEventHandler`、`imReciveMessageListener.js` 的原始 `Message` 日志、事件中心的 `connection` domain。
- Produces: 锁定真实事件注册、原始 `isOnline` 消费、无本地模拟和现有渲染后 SDK Read ACK 链路的回归保护。

- [x] **Step 1: 写入失败测试**

```js
assert.match(
  connectListener,
  /onOfflineMessageSyncStart:\s*\(\)\s*=>[\s\S]*recordConnectionSdkEvent\('onOfflineMessageSyncStart'\)/,
);
assert.match(
  receiveListener,
  /isOnline:\s*message\.isOnline/,
);
assert.match(
  messageItem,
  /v-if="msgBody\?\.isOnline === false"[\s\S]*SDK 离线同步消息/,
);
assert.doesNotMatch(
  `${connectListener}\n${receiveListener}\n${messageStore}`,
  /simulateOffline|mockOffline|forceOffline|offlineReadAckSuccess/,
);
```

- [x] **Step 2: 运行测试确认红灯**

Run: `node tests/specs/unit/sdk5-offline-read-receipt-contract-spec.cjs`

Expected: FAIL，因为当前连接监听器没有注册离线同步回调，消息日志/页面也没有显式消费 `isOnline`。

### Task 2: 用公开 SDK 5.0 原始事件和字段实现最小可观测链路

**Files:**
- Modify: `src/IM/listener/imConnectListener.js`
- Modify: `src/IM/listener/imReciveMessageListener.js`
- Modify: `src/views/Chat/components/InformDetails/index.vue`
- Modify: `src/views/Chat/components/Message/components/ChatMessageListItem/index.vue`
- Test: `tests/specs/unit/sdk5-offline-read-receipt-contract-spec.cjs`

**Interfaces:**
- Consumes: SDK 无载荷连接回调、SDK 原始 `Message.isOnline` 和 Vuex `recordSdkEvent`。
- Produces: 在事件中心、Console 和消息行可追踪的真实离线同步证据；不改变 `Message/index.vue` 到 `sendIncomingMessageReadReceipt` 的回执调用接口。

- [x] **Step 1: 实现连接事件记录**

```js
const recordConnectionSdkEvent = (eventName, payload) => {
  store.dispatch('recordSdkEvent', {
    domain: 'connection',
    eventName,
    payload,
    currentUserId: getCurrentUserId(),
  });
};

onOfflineMessageSyncStart: () => {
  recordConnectionSdkEvent('onOfflineMessageSyncStart');
  console.log('[Demo <- SDK 5.0 Event] ChatClient.onOfflineMessageSyncStart', {
    eventName: 'onOfflineMessageSyncStart', currentUser: getCurrentUserId(), payload: undefined,
  });
},
```

`onOfflineMessageSyncFinish` 使用相同方式记录。事件中心在 `eventDomains` 中增加 `{ value: 'connection', label: '连接事件' }`，使无会话 ID 的原始 Client 事件也可筛选。

- [x] **Step 2: 实现原始离线字段展示**

```js
console.log('[IM Message] SDK 收到消息', {
  messageId: messageIdOf(message),
  isOnline: message.isOnline,
  rawMessage: message,
});
```

消息项新增一个仅匹配 `msgBody?.isOnline === false` 的静态标签。不得将 `undefined`、`null` 或其他字段转换为离线标签。

- [x] **Step 3: 运行测试确认绿灯**

Run: `node tests/specs/unit/sdk5-offline-read-receipt-contract-spec.cjs`

Expected: PASS。

### Task 3: 同步已读回执约束、能力文档与完整静态验证

**Files:**
- Modify: `cases_list.md`
- Modify: `.codex/prompts/superpowers.md`
- Modify: `tests/specs/unit/sdk5-read-receipt-display-contract-spec.cjs`
- Modify: `tests/specs/unit/sdk5-incoming-read-state-contract-spec.cjs`
- Test: `tests/specs/unit/sdk5-offline-read-receipt-contract-spec.cjs`

**Interfaces:**
- Consumes: 已存在的 `sendIncomingMessageReadReceipt` 渲染后 action 和 `onMessageReadReceipts` 发送方回调。
- Produces: 与源码一致的能力文档和保证离线消息不旁路/不伪造 Read ACK 的契约。

- [x] **Step 1: 扩展既有 Read ACK 契约**

```js
assert.match(
  messageView,
  /newlyDisplayedMessages[\s\S]*sendIncomingMessageReadReceipt/,
);
assert.doesNotMatch(
  messageStore,
  /isOnline\s*!==\s*false|offline.*skip.*read.*receipt/i,
);
assert.doesNotMatch(messageStore, /CHATROOM[\s\S]*sendMessageReadReceipts/s);
```

- [x] **Step 2: 更新能力描述**

两个文档必须写明：离线同步事件和离线消息标签仅来自 SDK 实际下发；消息真正渲染后仍沿用公开 `sendMessageReadReceipts`；发送方只消费真实 `onMessageReadReceipts`；聊天室不支持该链路；真实两账号验证仍未执行。

- [x] **Step 3: 执行验证**

Run:

```bash
node tests/specs/unit/sdk5-offline-read-receipt-contract-spec.cjs
node tests/specs/unit/sdk5-viewed-message-read-receipt-contract-spec.cjs
node tests/specs/unit/sdk5-incoming-read-state-contract-spec.cjs
node tests/specs/unit/sdk5-read-receipt-display-contract-spec.cjs
node tests/specs/unit/sdk5-chat-event-lifecycle-contract-spec.cjs
node scripts/sdk5-migration-check.cjs
git diff --check
npm run build
```

Expected: 指定静态契约、迁移扫描、diff 检查和构建均 exit 0；现有 bundle-size warning 不视为构建失败。真实两账号验证结果须与这些静态结果分开报告。
