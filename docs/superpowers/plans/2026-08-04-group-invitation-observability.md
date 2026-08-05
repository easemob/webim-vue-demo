# 群邀请可观测性 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让群邀请请求与单聊、群组、聊天室 SDK 5.0 事件拥有可区分、可复现的原始日志和页面证据。

**Architecture:** `groups.js` 负责记录发送端 SDK Promise 的成功或失败；所有现有 SDK5 监听通过 Vuex 追加原始事件记录；`InformDetails` 只渲染该记录，不转换成 V4 数据模型。任何一端的结果都不推断另一端成功。

**Tech Stack:** Vue 3、Vuex、WebSDK 5.0、Node.js 静态契约测试。

## Global Constraints

- 仅使用 WebSDK 5.0 公开 API 和事件。
- 不记录 Token，不添加重试、REST 回退或本地伪造通知。
- HTTP/Promise 成功不能表示接收端事件成功。
- 事件记录只含 `domain`、`eventName`、`payload`、`receivedAt` 和 `currentUserId`；`payload` 保持 SDK 原始值。
- 同步更新 `cases_list.md` 与 `.codex/prompts/superpowers.md`。

---

### Task 1: 发送端邀请成功日志和回归契约

**Files:**
- Modify: `src/store/modules/groups.js:526-539`
- Modify: `src/IM/listener/imGroupListener.js:8-18`
- Create: `tests/specs/unit/sdk5-group-invitation-observability-contract-spec.cjs`
- Modify: `cases_list.md`
- Modify: `.codex/prompts/superpowers.md`

**Interfaces:**
- Consumes: `groupManager().inviteUsersToGroup({ groupId, userIds }): Promise<void>`。
- Produces: 发送端 `[SDK 5.0 Group] inviteUsersToGroup success` 日志；接收端原始 `onInvitationReceived` / `onAutoAcceptInvitationFromGroup` 事件日志。

- [ ] **Step 1: 写入失败的静态契约测试**

```js
assert.match(groupsSource, /\[SDK 5\.0 Group\] inviteUsersToGroup success/);
assert.match(groupsSource, /groupId,\s*userIds,\s*currentUser/);
assert.match(listenerSource, /onInvitationReceived/);
assert.match(listenerSource, /onAutoAcceptInvitationFromGroup/);
```

- [ ] **Step 2: 运行测试并确认因成功日志尚不存在而失败**

Run: `node tests/specs/unit/sdk5-group-invitation-observability-contract-spec.cjs`

Expected: 断言找不到 `inviteUsersToGroup success`。

- [ ] **Step 3: 最小生产代码与文档更新**

```js
const result = await groupManager().inviteUsersToGroup({ groupId, userIds });
console.log('[SDK 5.0 Group] inviteUsersToGroup success', {
  groupId,
  userIds,
  currentUser: getCurrentUserId(),
  result,
});
```

在两个文档中明确：发送端 Promise 成功仅表示请求成功；接收端仅以原始 SDK 事件为准。

- [ ] **Step 4: 运行契约测试并确认通过**

Run: `node tests/specs/unit/sdk5-group-invitation-observability-contract-spec.cjs`

Expected: PASS。

- [ ] **Step 5: 运行关联群事件契约与构建**

Run: `node tests/specs/unit/sdk5-group-events-contract-spec.cjs && npm run build && git diff --check`

Expected: 测试和构建退出码为 0；若有既有包体积警告，单独记录。

### Task 2: SDK5 统一事件中心

**Files:**
- Modify: `src/store/modules/conversation.js`
- Modify: `src/IM/listener/imReciveMessageListener.js`
- Modify: `src/IM/listener/imReadAckListener.js`
- Modify: `src/IM/listener/imReactionListener.js`
- Modify: `src/IM/listener/imGroupListener.js`
- Modify: `src/IM/listener/imChatroomListener.js`
- Modify: `src/views/Chat/components/InformDetails/index.vue`
- Create: `tests/specs/unit/sdk5-event-center-contract-spec.cjs`
- Modify: `cases_list.md`
- Modify: `.codex/prompts/superpowers.md`

**Interfaces:**
- Consumes: SDK5 named callbacks and their original payloads.
- Produces: `recordSdkEvent({ domain, eventName, payload, currentUserId })` and a filtered event center.

- [ ] **Step 1: 写入失败的静态契约测试**

```js
assert.match(conversation, /sdkEventRecords:\s*\[\]/);
assert.match(conversation, /RECORD_SDK_EVENT/);
assert.match(conversation, /recordSdkEvent/);
assert.match(view, /单聊事件/);
assert.match(view, /群组事件/);
assert.match(view, /聊天室事件/);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node tests/specs/unit/sdk5-event-center-contract-spec.cjs`

Expected: `sdkEventRecords` 断言失败。

- [ ] **Step 3: 最小实现**

在现有监听的原始 SDK 回调中调用 `store.dispatch('recordSdkEvent', { domain, eventName, payload, currentUserId })`；Vuex 保留最多 200 条；事件中心直接展示原始 payload，不转为 V4 字段。

- [ ] **Step 4: 运行回归与构建**

Run: `node tests/specs/unit/sdk5-event-center-contract-spec.cjs && node tests/specs/unit/sdk5-group-events-contract-spec.cjs && node tests/specs/unit/sdk5-chatroom-events-contract-spec.cjs && node tests/specs/unit/sdk5-chat-event-lifecycle-contract-spec.cjs && npm run build && git diff --check`

Expected: 测试和构建退出码为 0；实时事件是否下发仍需双账号实测。
