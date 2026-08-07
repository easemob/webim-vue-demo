# 单会话右键清空未读 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在单聊和群聊会话的右键菜单恢复手动“清空未读”，同时不改变进入会话后的自动清零行为。

**Architecture:** `ConversationList.vue` 提供手动菜单处理器并等待 Vuex action。`conversation.js` 只在 SDK 成功后提交本地未读数清零，并将失败重新抛给显式菜单入口；自动进入会话路径保留非阻塞调用且自行捕获失败。聊天室不渲染菜单项，因为 SDK 5.0 类型仅允许单聊和群聊。

**Tech Stack:** Vue 3 Composition API、Vuex、Element Plus、Node.js `node:test` 静态契约测试、WebSDK 5.0。

## Global Constraints

- 只能调用公开 WebSDK 5.0 `ChatManager.clearConversationUnreadMessageCount({ conversationId, conversationType })`。
- 不得使用 SDK 4.0 字段、兼容层、REST 回退、自动重试或本地伪造成功。
- SDK reject 后不得提交本地未读数清零，必须保留完整 console 错误与失败 toast。
- 点击进入单聊/群聊的自动清空未读必须保持非阻塞且不改变路由顺序。
- 同步 `cases_list.md` 与 `.codex/prompts/superpowers.md`，不提交现有工作区改动。

---

### Task 1: 写入并验证缺失菜单入口的回归契约

**Files:**
- Modify: `tests/specs/unit/sdk5-conversation-store-contract-spec.cjs`
- Test: `tests/specs/unit/sdk5-conversation-store-contract-spec.cjs`

**Interfaces:**
- Consumes: `ConversationList.vue` 的 `CONVERSATION_TYPE.SINGLE`、`CONVERSATION_TYPE.GROUP` 和 `clearConversationUnreadCount` action。
- Produces: 锁定手动菜单的 SDK 5.0 调用、聊天室排除和自动路径非阻塞的失败测试。

- [ ] **Step 1: 写入失败测试**

```js
assert.match(
  conversationList,
  /const clearConversationUnreadFromMenu = async \(conversationItem\) => \{[\s\S]*await store\.dispatch\('clearConversationUnreadCount', \{[\s\S]*conversationId,[\s\S]*conversationType,[\s\S]*\}\);/,
);
assert.match(
  conversationList,
  /<div\s+v-if="\[CONVERSATION_TYPE\.SINGLE, CONVERSATION_TYPE\.GROUP\]\.includes\(item\.conversationType\)"[\s\S]*@click="clearConversationUnreadFromMenu\(item\)"[\s\S]*>\s*清空未读\s*<\/div>/,
);
```

- [ ] **Step 2: 运行失败测试**

Run: `node --test tests/specs/unit/sdk5-conversation-store-contract-spec.cjs`

Expected: FAIL，因为 `clearConversationUnreadFromMenu` 和右键菜单项尚不存在。

- [ ] **Step 3: 实现最小行为**

```js
const clearConversationUnreadFromMenu = async (conversationItem) => {
  const { conversationId, conversationType } = conversationItem;
  await store.dispatch('clearConversationUnreadCount', {
    conversationId,
    conversationType,
  });
};
```

菜单项使用 `v-if` 仅匹配 `singleChat`、`groupChat`，并由 loading ref 防止重复点击。

- [ ] **Step 4: 运行通过测试**

Run: `node --test tests/specs/unit/sdk5-conversation-store-contract-spec.cjs`

Expected: PASS。

### Task 2: 保持 SDK 成功/失败边界并同步文档

**Files:**
- Modify: `src/store/modules/conversation.js:483-504`
- Modify: `src/views/Chat/components/Conversation/components/ConversationList.vue:140-160, 520-610`
- Modify: `cases_list.md`
- Modify: `.codex/prompts/superpowers.md`
- Test: `tests/specs/unit/sdk5-conversation-store-contract-spec.cjs`

**Interfaces:**
- Consumes: `clearConversationUnreadCount({ conversationId, conversationType })`。
- Produces: 显式菜单可感知的 SDK reject；自动进入会话路径继续无等待、无未处理 rejection。

- [ ] **Step 1: 扩展失败测试**

```js
assert.match(
  source,
  /clearConversationUnreadCount:[\s\S]*await chatManager\(\)\.clearConversationUnreadMessageCount\([\s\S]*commit\('CLEAR_CONVERSATION_ITEM_UNREAD_COUNT', conversationId\);[\s\S]*catch \(error\)[\s\S]*throw error;/,
);
assert.match(
  conversationList,
  /emit\('toChatMessage', conversationId, conversationType\);[\s\S]*void store\.dispatch\('clearConversationUnreadCount', \{[\s\S]*\}\)\.catch\(/,
);
```

- [ ] **Step 2: 运行失败测试**

Run: `node --test tests/specs/unit/sdk5-conversation-store-contract-spec.cjs`

Expected: FAIL，因为 Store 当前吞掉 SDK reject，自动路径尚未捕获 rejection。

- [ ] **Step 3: 实现最小 SDK 边界**

```js
try {
  await chatManager().clearConversationUnreadMessageCount({
    conversationId,
    conversationType,
  });
  commit('CLEAR_CONVERSATION_ITEM_UNREAD_COUNT', conversationId);
} catch (error) {
  console.error('[Conversation] clearConversationUnreadCount failed', {
    conversationId,
    conversationType,
    error,
  });
  throw error;
}
```

自动入口改为 `void store.dispatch(...).catch(...)`；菜单入口捕获 reject 后显示 `error?.message || '会话未读数清空失败'`。

- [ ] **Step 4: 更新能力描述**

在两个清单中写明：点击进入单聊/群聊自动清零保持不变；右键菜单可手动清零；两种路径均只调用同一 SDK 5.0 API；聊天室不提供该项。

- [ ] **Step 5: 运行通过验证**

Run: `node --test tests/specs/unit/sdk5-conversation-store-contract-spec.cjs && node scripts/sdk5-migration-check.cjs && npm run build && git diff --check`

Expected: 四个命令均以 exit code 0 结束；构建若出现现有 bundle-size warning，不视为失败。
