# 删除漫游消息入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在单聊和群聊的消息操作菜单中增加真实的 WebSDK 5.0 按消息 ID 删除漫游消息入口，并记录其他资源收到的真实删除事件。

**Architecture:** 消息组件只根据 SDK 5.0 原始 `conversationType` 和 `msgServerId` 决定入口可见性，并将服务端 ID 传给专门的 Vuex action。Vuex action 是唯一调用 `ChatManager.removeHistoryMessages` 的路径，只有 SDK Promise resolve 后才移除当前行。多端回调只记录 SDK 原始事件到 Console 和统一事件中心，不替代服务端的删除结果更新任何本地消息。

**Tech Stack:** Vue 3 `<script setup>`、Vuex、Element Plus、easemob-websdk 5.0.8、Node `assert` 静态合同测试。

## Global Constraints

- 只使用 WebSDK 5.0 公开 `ChatManager.removeHistoryMessages` 和 `onMultiDeviceMessageRemoved`；不使用 SDK 4.0、REST `/notify`、私有模块或兼容层。
- 删除入口仅限 `CONVERSATION_TYPE.SINGLE` 和 `CONVERSATION_TYPE.GROUP`，聊天室绝不展示或调用。
- 仅使用非空 `msgServerId` 作为 `messageIds` 值；不得以 `msgLocalId` 或任何本地 ID 替代。
- SDK reject 时保留消息、原始请求上下文和原始 error；不自动重试、不伪造成功。
- 当前实现和文档必须明确：静态测试与构建不等于真实服务端删除/多端回调已验证。
- 同步 `cases_list.md` 和 `.codex/prompts/superpowers.md`；不创建 commit、push、stash、reset 或清理用户文件。

---

### Task 1: 添加失败的 SDK 5.0 漫游删除合同测试

**Files:**
- Create: `tests/specs/unit/sdk5-roaming-message-delete-contract-spec.cjs`
- Test: `tests/specs/unit/sdk5-roaming-message-delete-contract-spec.cjs`

**Interfaces:**
- Consumes: 当前 `ChatMessageListItem`、Vuex `message` 模块、多端监听器和两份功能文档。
- Produces: 针对入口范围、服务端 ID、SDK 调用、事件监听和文档同步的可重复静态合同。

- [ ] **Step 1: 写入会先失败的合同测试**

```js
assert.match(messageItem, /const supportsRoamingMessageDelete = \(message\) =>/);
assert.match(messageItem, /conversationType === CONVERSATION_TYPE\.SINGLE[\s\S]*conversationType === CONVERSATION_TYPE\.GROUP/);
assert.match(messageItem, /message\?\.msgServerId/);
assert.match(messageItem, /删除漫游消息/);
assert.match(messageItem, /v-if="supportsRoamingMessageDelete\(msgBody\)"/);
assert.match(messageItem, /store\.dispatch\('removeMessageRoaming', \{[\s\S]*msgServerId: msgBody\.msgServerId/);
assert.doesNotMatch(messageItem, /removeMessageRoaming[\s\S]{0,240}msgLocalId/);

assert.match(messageStore, /removeMessageRoaming:\s*\(\{ dispatch, commit \}, params\) =>/);
assert.match(messageStore, /const \{ msgServerId, conversationId, conversationType \} = params;/);
assert.match(messageStore, /messageIds:\s*\[msgServerId\]/);
assert.match(messageStore, /removeHistoryMessages\(deleteOptions\)/);
assert.doesNotMatch(messageStore, /removeMessageRoaming[\s\S]{0,180}msgLocalId/);

assert.match(multiDeviceListener, /onMultiDeviceMessageRemoved:\s*\(event\) =>/);
assert.match(multiDeviceListener, /eventName:\s*'onMultiDeviceMessageRemoved'/);
assert.match(multiDeviceListener, /domain:\s*'singleChat'/);
assert.match(casesList, /删除漫游消息/);
assert.match(projectRules, /删除漫游消息/);
```

- [ ] **Step 2: 运行测试，确认因功能尚不存在而失败**

Run: `node tests/specs/unit/sdk5-roaming-message-delete-contract-spec.cjs`

Expected: `AssertionError` 指向缺少 `supportsRoamingMessageDelete`、`removeMessageRoaming` 或 `onMultiDeviceMessageRemoved`，而不是文件路径或 Node 运行时错误。

- [ ] **Step 3: 保留测试红灯输出作为实现基线**

Run: `node tests/specs/unit/sdk5-roaming-message-delete-contract-spec.cjs`

Expected: 再次报告同一类缺失契约；不修改现有生产逻辑以规避测试。

### Task 2: 实现单聊/群聊真实漫游消息删除

**Files:**
- Modify: `src/views/Chat/components/Message/components/ChatMessageListItem/index.vue:65,731,1460`
- Modify: `src/store/modules/message.js:680`
- Test: `tests/specs/unit/sdk5-roaming-message-delete-contract-spec.cjs`

**Interfaces:**
- Consumes: `CONVERSATION_TYPE.SINGLE`、`CONVERSATION_TYPE.GROUP`、消息原始 `msgServerId` 和 Vuex mutation `CHANGE_MESSAGE_BODAY`。
- Produces: `supportsRoamingMessageDelete(message)`、`deleteRoamingMessage(message)`、`removeMessageRoaming({ msgServerId, conversationId, conversationType })`。

- [ ] **Step 1: 在消息组件实现严格的入口条件和明确操作文案**

```js
const supportsRoamingMessageDelete = (message) => {
  const conversationType = message?.conversationType;
  return (
    !!message?.msgServerId &&
    (conversationType === CONVERSATION_TYPE.SINGLE ||
      conversationType === CONVERSATION_TYPE.GROUP)
  );
};

const deleteRoamingMessage = async (msgBody) => {
  if (!supportsRoamingMessageDelete(msgBody)) {
    const error = new Error('删除漫游消息需要单聊或群聊消息的 msgServerId');
    console.error('[Message Roaming Delete] 前置条件不满足', { msgBody, error });
    ElMessage({ type: 'error', message: error.message, center: true });
    return;
  }
  await ElMessageBox.confirm(
    '将从服务端删除该条漫游消息记录，确认继续吗？',
    '删除漫游消息',
    { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' },
  );
  await store.dispatch('removeMessageRoaming', {
    msgServerId: msgBody.msgServerId,
    conversationId: msgBody.conversationId,
    conversationType: msgBody.conversationType,
  });
};
```

将菜单项替换为：

```vue
<el-dropdown-item
  v-if="supportsRoamingMessageDelete(msgBody)"
  @click="deleteRoamingMessage(msgBody)"
>
  删除漫游消息
</el-dropdown-item>
```

保留全局 `messageIdOf` 给定位、引用等已有能力使用，但绝不从新函数或新 action 读取 `msgLocalId`。

- [ ] **Step 2: 在 Vuex 实现唯一服务端删除 action**

```js
removeMessageRoaming: ({ dispatch, commit }, params) => {
  const { msgServerId, conversationId, conversationType } = params;
  const isSupportedConversation =
    conversationType === CONVERSATION_TYPE.SINGLE ||
    conversationType === CONVERSATION_TYPE.GROUP;
  if (!conversationId || !msgServerId || !isSupportedConversation) {
    const error = new Error('删除漫游消息需要单聊或群聊的 conversationId、conversationType 和 msgServerId');
    console.error('[Message Roaming Delete] 请求前置条件不满足', { params, error });
    return Promise.reject(error);
  }
  const deleteOptions = { conversationId, conversationType, messageIds: [msgServerId] };
  console.log('[Demo -> SDK 5.0 API] ChatManager.removeHistoryMessages', { api: 'ChatManager.removeHistoryMessages', params: deleteOptions });
  return chatManager().removeHistoryMessages(deleteOptions).then((response) => {
    console.log('[Demo <- SDK 5.0 API] ChatManager.removeHistoryMessages', { api: 'ChatManager.removeHistoryMessages', params: deleteOptions, response });
    commit('CHANGE_MESSAGE_BODAY', { type: CHANGE_MESSAGE_BODAY_TYPE.DELETE, key: conversationId, messageId: msgServerId });
    dispatch('updateConversationList', { conversationId, conversationType });
    return response;
  }).catch((error) => {
    console.error('[Demo <- SDK 5.0 API] ChatManager.removeHistoryMessages failed', { api: 'ChatManager.removeHistoryMessages', params: deleteOptions, error });
    throw error;
  });
},
```

移除旧的通用 `removeMessage` action 与 `deleteMessage` 菜单调用，避免两个名字指向同一服务端动作；不要修改会话级 `deleteConversation({ deleteRoamingMessages: true })`。

- [ ] **Step 3: 运行合同测试，确认实现转绿**

Run: `node tests/specs/unit/sdk5-roaming-message-delete-contract-spec.cjs`

Expected: 输出 `sdk5 roaming message delete contract: PASS`。

### Task 3: 记录真实多端删除事件并同步功能文档

**Files:**
- Modify: `src/IM/listener/imMultiDeviceListener.js:1,40`
- Modify: `cases_list.md:消息-展示与交互、聊天室-消息、SDK 5.0 统一事件中心`
- Modify: `.codex/prompts/superpowers.md:当前功能基线与强制同步说明`
- Test: `tests/specs/unit/sdk5-roaming-message-delete-contract-spec.cjs`

**Interfaces:**
- Consumes: SDK 5.0 `MultiDeviceMessageRemovedEvent` 的原始 `conversationId`、`conversationType`、`messageIds`、`beforeTimestamp`、`deviceId` 和 `store.dispatch('recordSdkEvent', ...)`。
- Produces: `ChatManager.onMultiDeviceMessageRemoved` 的真实日志和事件中心 `singleChat` 记录。

- [ ] **Step 1: 在已有命名 ChatManager listener 中注册原始多端删除回调**

```js
onMultiDeviceMessageRemoved: (event) => {
  const receivedAt = Date.now();
  console.log('[Demo <- SDK 5.0 Event] ChatManager.onMultiDeviceMessageRemoved', {
    eventName: 'onMultiDeviceMessageRemoved',
    conversationId: event?.conversationId,
    conversationType: event?.conversationType,
    messageIds: event?.messageIds,
    beforeTimestamp: event?.beforeTimestamp,
    deviceId: event?.deviceId,
    rawEvent: event,
  });
  Promise.resolve(store.dispatch('recordSdkEvent', {
    domain: 'singleChat',
    eventName: 'onMultiDeviceMessageRemoved',
    payload: event,
    currentUserId: getCurrentUserId(),
    receivedAt,
  })).catch((error) => console.error('[imMultiDeviceListener.recordSdkEvent]', error));
},
```

从 `../index` 导入 `getCurrentUserId`。回调不得提交 `CHANGE_MESSAGE_BODAY`、不得改写 `event`，不得把本端 SDK 未下发的事件补造为已收到。

- [ ] **Step 2: 将功能文档改为当前可见能力和真实验证边界**

在 `cases_list.md` 的“消息-展示与交互”替换通用“删除消息”为“删除漫游消息（仅单聊/群聊，使用 `msgServerId` 调用服务端；resolve 后才移除当前行；聊天室无入口）”。从“聊天室-消息”移除“删除消息”。在“SDK 5.0 统一事件中心”补充真实 `onMultiDeviceMessageRemoved` 只记录原始 payload，并说明同设备回显未下发时不伪造。

在 `.codex/prompts/superpowers.md` 当前功能基线中补充同一条规则：删除漫游消息只能走 `removeHistoryMessages({ conversationId, conversationType, messageIds: [msgServerId] })`，不可使用 `msgLocalId` 或 `/notify`，失败不删本地消息；多端回调只记录真实 `onMultiDeviceMessageRemoved`。

- [ ] **Step 3: 运行合同测试与邻近回归**

Run: `node tests/specs/unit/sdk5-roaming-message-delete-contract-spec.cjs`

Expected: 输出 `sdk5 roaming message delete contract: PASS`。

Run: `node tests/specs/unit/sdk5-message-expanded-capabilities-contract-spec.cjs`

Expected: 输出 `sdk5 expanded message capabilities contract: PASS`。

Run: `node tests/specs/unit/sdk5-event-center-contract-spec.cjs`

Expected: 输出 `sdk5 event center contract: PASS`。

### Task 4: 构建与真实双端验证交接

**Files:**
- Verify: `src/views/Chat/components/Message/components/ChatMessageListItem/index.vue`
- Verify: `src/store/modules/message.js`
- Verify: `src/IM/listener/imMultiDeviceListener.js`
- Verify: `cases_list.md`
- Verify: `.codex/prompts/superpowers.md`

**Interfaces:**
- Consumes: 已通过的静态合同与项目构建配置。
- Produces: 可安装/运行的构建证据，以及不夸大真实服务器验证结论的双端操作步骤。

- [ ] **Step 1: 运行源码和构建检查**

Run: `git diff --check`

Expected: 无输出、退出码 0。

Run: `yarn build`

Expected: 退出码 0；若仅报告既有资源体积 warning，在结果中单独注明，不作为本功能失败。

- [ ] **Step 2: 检查改动范围**

Run: `git status --short`

Expected: 只包含本计划列出的消息组件、Store、监听器、两份文档、合同测试与计划文档；不执行 `git add`、`git commit`、`git push`、`git reset`、`git stash` 或删除操作。

- [ ] **Step 3: 交接真实服务验证步骤**

使用同一用户的不同 SDK `resource` 登录 A 和 B。A 在单聊、群聊各取得有 `msgServerId` 的漫游消息后点击“删除漫游消息”；验证 A 的 SDK `removeHistoryMessages` DELETE 成功、重新拉取时该条不返回；验证 B 只在 SDK 实际下发 `onMultiDeviceMessageRemoved` 时出现事件中心记录。未完成这套双端实测时，只能报告“静态合同和构建通过，服务端链路待验证”。
