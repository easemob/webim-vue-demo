# 按时间删除当前会话漫游消息 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前单聊或群聊顶部的“更多操作”区提供分钟级时间选择和二次确认，并使用 WebSDK 5.0 真实删除所选时间点之前的该会话服务端漫游消息。

**Architecture:** `src/store/modules/message.js` 新增一个仅负责请求和原始日志的 Vuex action；它不提交任何按时间的本地消息删除。`Message/index.vue` 负责入口可见性、分钟级时间选择、二次确认和 SDK resolve 后的缓存清空与真实历史重拉取。重拉取失败向用户和 Console 如实暴露，绝不以本地时间过滤伪造服务端删除结果。

**Tech Stack:** Vue 3 `<script setup>`、Vuex、Element Plus、easemob-websdk 5.0.8、Node `assert` 静态合同测试、Yarn 构建。

## Global Constraints

- 只使用 WebSDK 5.0 公开 `ChatManager.removeHistoryMessages({ conversationId, conversationType, beforeTimestamp })`；不使用 SDK 4.0、REST `/notify`、私有模块或兼容层。
- 分支硬门禁：`src/` 运行代码不得存在或新增 `EMClient`、`WebIM`、`conn`、`chatType`、`mid`、`msg` 等 SDK 4.0 调用或旧消息模型别名；不得用旧字段补齐 SDK 5.0 缺失数据。
- 入口仅支持非话题的 `CONVERSATION_TYPE.SINGLE` 和 `CONVERSATION_TYPE.GROUP`；聊天室和消息话题不展示、不调用。
- 日期时间控件的用户可选精度固定为分钟，显示 `YYYY-MM-DD HH:mm`；所选值必须是正的安全毫秒整数，且为整分钟边界。
- `beforeTimestamp` 的真实 SDK 语义是删除该时间戳之前的消息；不得按本地 `timestamp` 过滤、猜测或补造服务器删除边界。
- SDK reject 时保留当前消息和历史游标；SDK resolve 后才清空当前会话缓存并从首游标真实重新拉取。
- 重新拉取失败必须显示该失败，不能把缓存清空或旧缓存当作服务端删除成功；不自动重试。
- Console 对删除和重拉取必须保留 API、完整参数、原始 response/error，以及可用的 `code`、`details`、`message`、`stack`。
- 同步 `cases_list.md`、`.codex/prompts/superpowers.md` 和 `docs/sdk5-api-coverage.md`，只声明已实现页面入口；静态/构建验证不能写成服务端 PASS。
- 用户要求不提交代码：执行时不得 `git add`、`git commit`、`git push`、`stash`、`reset`、`clean` 或覆盖当前工作区已有修改。

---

### Task 1: 为按时间删除 SDK 调用建立红灯合同

**Files:**
- Create: `tests/specs/unit/sdk5-roaming-message-time-delete-store-contract-spec.cjs`
- Modify: `src/store/modules/message.js:680`（下一任务）
- Test: `tests/specs/unit/sdk5-roaming-message-time-delete-store-contract-spec.cjs`

**Interfaces:**
- Consumes: Vuex `message` 模块、WebSDK 5.0 `ChatManager.removeHistoryMessages`。
- Produces: 规定 `removeMessageRoamingBeforeTimestamp({ conversationId, conversationType, beforeTimestamp })` 的唯一 SDK 请求边界。

- [ ] **Step 1: 写入先失败的 Store 合同测试**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);
const start = messageStore.indexOf('removeMessageRoamingBeforeTimestamp:');
const end = messageStore.indexOf('//撤回消息', start);

assert.notEqual(start, -1, 'Store 必须提供按时间删除漫游消息的独立 action。');
assert.notEqual(end, -1, '按时间删除 action 后必须保留现有撤回 action。');

const action = messageStore.slice(start, end);
assert.match(
  action,
  /const \{ conversationId, conversationType, beforeTimestamp \} = params \|\| \{\};/,
  'action 必须只从显式 SDK 5.0 会话参数读取删除边界。',
);
assert.match(action, /conversationType === CONVERSATION_TYPE\.SINGLE/);
assert.match(action, /conversationType === CONVERSATION_TYPE\.GROUP/);
assert.match(action, /Number\.isSafeInteger\(normalizedBeforeTimestamp\)/);
assert.match(action, /beforeTimestamp: normalizedBeforeTimestamp/);
assert.match(action, /removeHistoryMessages\(deleteOptions\)/);
assert.match(action, /\[Demo -> SDK 5\.0 API\] ChatManager\.removeHistoryMessages/);
assert.match(action, /\[Demo <- SDK 5\.0 API\] ChatManager\.removeHistoryMessages failed/);
assert.doesNotMatch(action, /messageIds/);
assert.doesNotMatch(action, /CLEAR_SOMEONE_MESSAGE|CHANGE_MESSAGE_BODAY/);
assert.doesNotMatch(action, /\/notify|fetch\(|axios|XMLHttpRequest/);

console.log('sdk5 roaming message time-delete store contract: PASS');
```

- [ ] **Step 2: 运行测试，确认它在功能不存在时失败**

Run: `node tests/specs/unit/sdk5-roaming-message-time-delete-store-contract-spec.cjs`

Expected: `AssertionError: Store 必须提供按时间删除漫游消息的独立 action。`；不得出现 Node 模块解析或文件路径错误。

### Task 2: 实现独立的真实 SDK 5.0 按时间删除 action

**Files:**
- Modify: `src/store/modules/message.js:680-740`
- Test: `tests/specs/unit/sdk5-roaming-message-time-delete-store-contract-spec.cjs`

**Interfaces:**
- Consumes: `CONVERSATION_TYPE.SINGLE`、`CONVERSATION_TYPE.GROUP`、`requireManager('chatManager')` 和 `{ conversationId, conversationType, beforeTimestamp }`。
- Produces: `removeMessageRoamingBeforeTimestamp(_, params): Promise<unknown>`；resolve 时只返回 SDK 原始 response，reject 时重新抛出原始 error。

- [ ] **Step 1: 在现有 `removeMessageRoaming` 后新增最小 action**

```js
// 删除当前单聊或群聊在指定时间点之前的服务端漫游消息。
removeMessageRoamingBeforeTimestamp: (_, params) => {
  const { conversationId, conversationType, beforeTimestamp } = params || {};
  const normalizedBeforeTimestamp = Number(beforeTimestamp);
  const isSupportedConversation =
    conversationType === CONVERSATION_TYPE.SINGLE ||
    conversationType === CONVERSATION_TYPE.GROUP;

  if (
    !conversationId ||
    !isSupportedConversation ||
    !Number.isSafeInteger(normalizedBeforeTimestamp) ||
    normalizedBeforeTimestamp <= 0
  ) {
    const error = new Error(
      '按时间删除漫游消息需要单聊或群聊的 conversationId、conversationType 和正整数 beforeTimestamp',
    );
    console.error('[Message Roaming Time Delete] 请求前置条件不满足', {
      params,
      error,
    });
    return Promise.reject(error);
  }

  const deleteOptions = {
    conversationId,
    conversationType,
    beforeTimestamp: normalizedBeforeTimestamp,
  };
  console.log('[Demo -> SDK 5.0 API] ChatManager.removeHistoryMessages', {
    api: 'ChatManager.removeHistoryMessages',
    mode: 'beforeTimestamp',
    params: deleteOptions,
  });
  return chatManager()
    .removeHistoryMessages(deleteOptions)
    .then((response) => {
      console.log('[Demo <- SDK 5.0 API] ChatManager.removeHistoryMessages', {
        api: 'ChatManager.removeHistoryMessages',
        mode: 'beforeTimestamp',
        params: deleteOptions,
        response,
      });
      return response;
    })
    .catch((error) => {
      console.error(
        '[Demo <- SDK 5.0 API] ChatManager.removeHistoryMessages failed',
        {
          api: 'ChatManager.removeHistoryMessages',
          mode: 'beforeTimestamp',
          params: deleteOptions,
          error,
          errorCode: error?.code,
          errorDetails: error?.details,
          errorMessage: error?.message,
          errorStack: error?.stack,
        },
      );
      throw error;
    });
},
```

不要在此 action 内 `commit`、`dispatch`、传 `messageIds`，或以任何方式按本地时间戳修改消息列表。

- [ ] **Step 2: 运行 Store 合同测试，确认 action 通过**

Run: `node tests/specs/unit/sdk5-roaming-message-time-delete-store-contract-spec.cjs`

Expected: `sdk5 roaming message time-delete store contract: PASS`。

### Task 3: 为分钟选择、二次确认和真实重拉取建立红灯合同

**Files:**
- Create: `tests/specs/unit/sdk5-roaming-message-time-delete-ui-contract-spec.cjs`
- Modify: `src/views/Chat/components/Message/index.vue:30-115,536-584,763-875`（下一任务）
- Test: `tests/specs/unit/sdk5-roaming-message-time-delete-ui-contract-spec.cjs`

**Interfaces:**
- Consumes: 当前路由的 `conversationId` / `conversationType` / `isChatThread`、`removeMessageRoamingBeforeTimestamp` action、`CLEAR_SOMEONE_MESSAGE` mutation 和 `fechHistoryMessage`。
- Produces: 顶部入口、分钟级 `el-date-picker`、二次确认、真实服务端重拉取编排，以及可被调用方感知的重拉取错误。

- [ ] **Step 1: 写入 UI 合同测试**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(
  path.resolve(__dirname, '../../../src/views/Chat/components/Message/index.vue'),
  'utf8',
);

assert.match(page, /const isRoamingMessageTimeDeleteVisible = computed\(\(\) =>/);
assert.match(
  page,
  /CONVERSATION_TYPE\.SINGLE,[\s\S]*CONVERSATION_TYPE\.GROUP/,
  '顶部入口只能枚举单聊和群聊。',
);
assert.match(page, /!routeQueryData\.value\.isChatThread/);
assert.match(page, /const selectedRoamingMessageDeleteTimestamp = ref\(''\);/);
assert.match(page, /const confirmRoamingMessageTimeDelete = async \(\) =>/);
assert.match(page, /beforeTimestamp % 60000 !== 0/);
assert.match(page, /store\.dispatch\('removeMessageRoamingBeforeTimestamp', \{[\s\S]*conversationId,[\s\S]*conversationType,[\s\S]*beforeTimestamp,/);
assert.match(page, /store\.commit\('CLEAR_SOMEONE_MESSAGE', conversationId\);/);
assert.match(page, /historyMessageCursor\.value = -1;/);
assert.match(page, /await fechHistoryMessage\('fistLoad', \{ throwOnError: true \}\);/);
assert.match(page, /const fechHistoryMessage = async \(loadType, \{ throwOnError = false \} = \{\}\) =>/);
assert.match(page, /if \(throwOnError\) throw error;/);
assert.match(page, /type="datetime"/);
assert.match(page, /format="YYYY-MM-DD HH:mm"/);
assert.match(page, /time-format="HH:mm"/);
assert.match(page, /value-format="x"/);
assert.match(page, /删除该时间点之前的服务端漫游消息/);
assert.match(page, /二次确认删除漫游消息/);

const handlerStart = page.indexOf('const confirmRoamingMessageTimeDelete = async () =>');
const handlerEnd = page.indexOf('//消息重新编辑', handlerStart);
const handler = page.slice(handlerStart, handlerEnd);
assert.doesNotMatch(handler, /\.filter\([\s\S]{0,300}timestamp/);
assert.doesNotMatch(handler, /\/notify|fetch\(|axios|XMLHttpRequest/);

console.log('sdk5 roaming message time-delete UI contract: PASS');
```

- [ ] **Step 1a: 将 UI 合同收紧为真实顺序、真实重拉取和 SDK 4.0 分支门禁**

在上述测试的 `console.log` 之前加入以下断言。它们必须约束同一个确认处理器中的调用顺序，而不是只在整页分别搜索字符串：

```js
assert.notEqual(handlerStart, -1, '必须存在按时间删除确认处理器。');
assert.notEqual(handlerEnd, -1, '确认处理器必须在消息重新编辑函数前结束。');
assert.match(
  handler,
  /await store\.dispatch\('removeMessageRoamingBeforeTimestamp', \{[\s\S]*?conversationId,[\s\S]*?conversationType,[\s\S]*?beforeTimestamp,[\s\S]*?\}\);/,
  '必须等待 SDK 删除 resolve，不能并行清理本地缓存。',
);
const deleteDispatchIndex = handler.indexOf(
  "await store.dispatch('removeMessageRoamingBeforeTimestamp'",
);
const clearCacheIndex = handler.indexOf(
  "store.commit('CLEAR_SOMEONE_MESSAGE', conversationId);",
);
const resetCursorIndex = handler.indexOf('historyMessageCursor.value = -1;');
const reloadIndex = handler.indexOf(
  "await fechHistoryMessage('fistLoad', { throwOnError: true });",
);
assert.ok(
  deleteDispatchIndex >= 0 &&
    deleteDispatchIndex < clearCacheIndex &&
    clearCacheIndex < resetCursorIndex &&
    resetCursorIndex < reloadIndex,
  '只有 SDK 删除 resolve 后才能清缓存、重置游标并重拉取服务端消息。',
);
assert.match(
  handler,
  /ElMessageBox\.confirm\([\s\S]*?二次确认删除漫游消息/,
  '确认处理器必须实际弹出二次危险确认。',
);
assert.doesNotMatch(
  handler,
  /\.filter\(|\.reduce\(|\.find\(|for\s*\(|\/notify|fetch\(|axios|XMLHttpRequest|\brequest\b|\$http|RestClient|retry|setTimeout|\bEMClient\b|\bWebIM\b|\bconn\s*\.|\bchatType\s*:|\bmid\s*:|\bmsg\s*:/,
  '确认处理器不得本地筛选、走 HTTP/REST/重试或引入 SDK 4.0 路径。',
);

const visibilityStart = page.indexOf(
  'const isRoamingMessageTimeDeleteVisible = computed(() =>',
);
const visibilityEnd = page.indexOf(
  'const formatRoamingMessageDeleteMinute =',
  visibilityStart,
);
const visibility = page.slice(visibilityStart, visibilityEnd);
assert.match(visibility, /!!conversationId/);
assert.match(visibility, /!isChatThread/);
assert.match(
  visibility,
  /\[CONVERSATION_TYPE\.SINGLE, CONVERSATION_TYPE\.GROUP\]\.includes\([\s\S]*?conversationType/,
  '入口可见性必须在同一个 computed 中限定为单聊/群聊。',
);
assert.match(
  page,
  /v-if="isRoamingMessageTimeDeleteVisible"[\s\S]{0,600}@click="openRoamingMessageTimeDeleteDialog"/,
  '可见性 computed 必须实际控制顶部入口。',
);
assert.match(
  page,
  /v-model="selectedRoamingMessageDeleteTimestamp"[\s\S]{0,500}type="datetime"[\s\S]{0,500}@click="confirmRoamingMessageTimeDelete"/,
  '日期时间选择器必须绑定删除边界，并能进入二次确认。',
);

const sourceRoot = path.resolve(__dirname, '../../../src');
const collectRuntimeSources = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectRuntimeSources(entryPath);
    return /\.(js|vue|ts)$/.test(entry.name)
      ? [fs.readFileSync(entryPath, 'utf8')]
      : [];
  });
const runtimeSource = collectRuntimeSources(sourceRoot).join('\n');
assert.doesNotMatch(
  runtimeSource,
  /\bEMClient\b|\bWebIM\b|\bconn\s*\.|\bthis\.conn\b|\bchatType\s*:|\bmid\s*:|\bmsg\s*:/,
  'SDK 5.0 分支运行代码不得存在 SDK 4.0 客户端、调用或旧消息模型别名。',
);
```

- [ ] **Step 1b: 将二次确认和重拉取错误传播绑定到同一真实路径**

继续在 UI 合同测试的 `console.log` 之前增加以下断言。二次确认必须被等待并发生在 SDK 删除之前；`throwOnError` 必须属于 `fechHistoryMessage` 的 catch 分支，而不是页面内任意无关函数：

```js
assert.match(
  handler,
  /await ElMessageBox\.confirm\([\s\S]*?二次确认删除漫游消息/,
  '用户必须完成二次确认后才可继续删除。',
);
const confirmationIndex = handler.indexOf('await ElMessageBox.confirm');
assert.ok(
  confirmationIndex >= 0 && confirmationIndex < deleteDispatchIndex,
  '二次确认 resolve 必须先于 SDK 删除请求。',
);

const historyLoaderStart = page.indexOf(
  'const fechHistoryMessage = async (loadType, { throwOnError = false } = {}) =>',
);
const historyLoaderEnd = page.indexOf(
  '//获取当前会话的原始 SDK 5.0 消息列表。',
  historyLoaderStart,
);
const historyLoader = page.slice(historyLoaderStart, historyLoaderEnd);
assert.notEqual(historyLoaderStart, -1, '必须存在可抛出刷新错误的历史加载函数。');
assert.notEqual(historyLoaderEnd, -1, '历史加载函数必须在消息列表 computed 前结束。');
assert.match(
  historyLoader,
  /catch \(error\) \{[\s\S]*?if \(throwOnError\) throw error;/,
  'fechHistoryMessage 必须在自身 catch 内传播要求上抛的真实重拉取错误。',
);
assert.match(
  historyLoader,
  /store\.dispatch\('getHistoryMessage', \{[\s\S]*?conversationId:[\s\S]*?conversationType:/,
  '重拉取必须走显式当前会话的 Store 历史消息路径。',
);

const messageStore = fs.readFileSync(
  path.resolve(__dirname, '../../../src/store/modules/message.js'),
  'utf8',
);
assert.match(
  messageStore,
  /getHistoryMessage:[\s\S]*?chatManager\(\)\.getHistoryMessages\(options\)/,
  'Store 历史路径必须实际调用 SDK 5.0 ChatManager.getHistoryMessages。',
);
```

- [ ] **Step 1c: 闭合真实重拉取 await 链路，并把分钟属性绑定到同一个控件**

继续在 UI 合同测试的 `console.log` 前加入以下断言。它们禁止未等待的内部历史请求、跨 action 的 SDK 调用假阳性，以及由不同控件分别满足分钟属性的假阳性：

```js
assert.match(
  historyLoader,
  /const result = await store\.dispatch\('getHistoryMessage', \{[\s\S]*?conversationId:[\s\S]*?conversationType:/,
  'fechHistoryMessage 必须等待当前会话的真实 Store 历史请求完成。',
);

const historyActionStart = messageStore.indexOf('getHistoryMessage: async');
const historyActionEnd = messageStore.indexOf(
  '//已发送展示类型消息',
  historyActionStart,
);
const historyAction = messageStore.slice(historyActionStart, historyActionEnd);
assert.notEqual(historyActionStart, -1, 'Store 必须存在 getHistoryMessage action。');
assert.notEqual(historyActionEnd, -1, 'getHistoryMessage action 必须在发送展示 action 前结束。');
assert.match(
  historyAction,
  /chatManager\(\)\.getHistoryMessages\(options\)[\s\S]*?\.then\(/,
  '同一个 getHistoryMessage action 必须调用 SDK 5.0 ChatManager.getHistoryMessages。',
);

const timeDeleteDialogStart = page.indexOf(
  '<el-dialog\n      v-model="roamingMessageTimeDeleteDialogVisible"',
);
const timeDeleteDialogEnd = page.indexOf('</el-dialog>', timeDeleteDialogStart);
const timeDeleteDialog = page.slice(timeDeleteDialogStart, timeDeleteDialogEnd);
assert.notEqual(timeDeleteDialogStart, -1, '必须存在按时间删除漫游消息的日期选择弹窗。');
assert.notEqual(timeDeleteDialogEnd, -1, '按时间删除弹窗必须完整关闭。');
assert.match(
  timeDeleteDialog,
  /<el-date-picker[\s\S]*?v-model="selectedRoamingMessageDeleteTimestamp"[\s\S]*?type="datetime"[\s\S]*?format="YYYY-MM-DD HH:mm"[\s\S]*?time-format="HH:mm"[\s\S]*?value-format="x"[\s\S]*?@click="confirmRoamingMessageTimeDelete"/,
  '同一个按时间删除弹窗必须将分钟级日期控件绑定到删除边界和下一步确认。',
);
```

将 Step 1a 中处理器禁止 HTTP/REST 的正则补充 `\bhttp(?:Client)?\s*\.`，使 `http.get(...)` 与 `httpClient.get(...)` 同样不能作为删除旁路。

- [ ] **Step 1d: 禁止额外本地迭代和网络旁路，并闭合日期控件标签范围**

把 Step 1a 中 `handler` 的禁止正则替换为下列范围。它覆盖常见数组迭代、循环、直接/封装 HTTP 和浏览器旁路；SDK 删除函数本身仍由前面的正向断言单独允许：

```js
assert.doesNotMatch(
  handler,
  /\.filter\(|\.reduce\(|\.find\(|\.forEach\(|\.map\(|\.some\(|\.every\(|for\s*\(|while\s*\(|do\s*\{|\/notify|fetch\(|axios|XMLHttpRequest|\brequest\b|\$http|RestClient|\bhttp(?:Client)?\s*\.|\$\s*\.\s*ajax|\bky\s*\(|\bsuperagent\b|sendBeacon|retry|setTimeout|\bEMClient\b|\bWebIM\b|\bconn\s*\.|\bchatType\s*:|\bmid\s*:|\bmsg\s*:/,
  '确认处理器不得本地筛选/迭代、走 HTTP/REST/重试或引入 SDK 4.0 路径。',
);
```

将 Step 1c 中 `timeDeleteDialog` 的宽松 `el-date-picker` 正则替换为单个闭合标签切片，确保被确认处理器使用的同一控件同时具备分钟格式与毫秒输出：

```js
const datePickerStart = timeDeleteDialog.indexOf('<el-date-picker');
const datePickerEnd = timeDeleteDialog.indexOf('/>', datePickerStart);
const timeDeleteDatePicker = timeDeleteDialog.slice(
  datePickerStart,
  datePickerEnd,
);
assert.notEqual(datePickerStart, -1, '按时间删除弹窗必须包含日期时间控件。');
assert.notEqual(datePickerEnd, -1, '日期时间控件必须以自闭合标签结束。');
assert.match(timeDeleteDatePicker, /v-model="selectedRoamingMessageDeleteTimestamp"/);
assert.match(timeDeleteDatePicker, /type="datetime"/);
assert.match(timeDeleteDatePicker, /format="YYYY-MM-DD HH:mm"/);
assert.match(timeDeleteDatePicker, /time-format="HH:mm"/);
assert.match(timeDeleteDatePicker, /value-format="x"/);
assert.match(
  timeDeleteDialog,
  /@click="confirmRoamingMessageTimeDelete"/,
  '同一按时间删除弹窗必须提供进入二次确认的下一步按钮。',
);
```

- [ ] **Step 2: 运行测试，确认它在 UI 不存在时失败**

Run: `node tests/specs/unit/sdk5-roaming-message-time-delete-ui-contract-spec.cjs`

Expected: `AssertionError` 指向缺少 `isRoamingMessageTimeDeleteVisible`；不得为了通过测试而增加 REST 或本地时间过滤。

### Task 4: 实现顶部分钟选择、二次确认和服务器真值刷新

**Files:**
- Modify: `src/views/Chat/components/Message/index.vue:30-115,536-584,763-875`
- Test: `tests/specs/unit/sdk5-roaming-message-time-delete-ui-contract-spec.cjs`

**Interfaces:**
- Consumes: `store.dispatch('removeMessageRoamingBeforeTimestamp', request)`，其中 `request` 是 `{ conversationId, conversationType, beforeTimestamp }`。
- Produces: 仅用于当前会话的 `confirmRoamingMessageTimeDelete()`；SDK 删除失败或历史重拉失败时该函数自行显示真实失败且不报告成功。

- [ ] **Step 1: 在顶部操作状态区添加可见性与表单状态**

在 `pinnedMessageList` 状态附近新增以下代码。`beforeTimestamp` 不在这里计算或补值；时间选择器的 `value-format="x"` 返回值由确认函数验证。

```js
const roamingMessageTimeDeleteDialogVisible = ref(false);
const roamingMessageTimeDeleteLoading = ref(false);
const selectedRoamingMessageDeleteTimestamp = ref('');
const isRoamingMessageTimeDeleteVisible = computed(() => {
  const { conversationId, conversationType, isChatThread } =
    routeQueryData.value || {};
  return (
    !!conversationId &&
    !isChatThread &&
    [CONVERSATION_TYPE.SINGLE, CONVERSATION_TYPE.GROUP].includes(
      conversationType,
    )
  );
});
const formatRoamingMessageDeleteMinute = (beforeTimestamp) => {
  const date = new Date(beforeTimestamp);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const openRoamingMessageTimeDeleteDialog = () => {
  if (!isRoamingMessageTimeDeleteVisible.value) return;
  selectedRoamingMessageDeleteTimestamp.value = '';
  roamingMessageTimeDeleteDialogVisible.value = true;
};
```

- [ ] **Step 2: 扩展历史加载函数，使删除后的真实重拉取错误可向调用者传播**

将函数签名改为：

```js
const fechHistoryMessage = async (loadType, { throwOnError = false } = {}) => {
```

保留原有正常历史加载流程。在既有 `catch (error)` 的 `console.error` 和 `isMoreHistoryMsg.value = false` 后、`return []` 前插入：

```js
if (throwOnError) throw error;
```

这样路由初次加载和“加载更多”仍使用既有吞错展示行为，而按时间删除的刷新路径能如实判定服务端重新拉取失败。

- [ ] **Step 3: 添加确认函数，严格按 SDK resolve 后才清缓存并重拉取**

在 `fechHistoryMessage` 后新增：

```js
const confirmRoamingMessageTimeDelete = async () => {
  const { conversationId, conversationType } = routeQueryData.value || {};
  const beforeTimestamp = Number(selectedRoamingMessageDeleteTimestamp.value);
  if (
    !Number.isSafeInteger(beforeTimestamp) ||
    beforeTimestamp <= 0 ||
    beforeTimestamp % 60000 !== 0
  ) {
    const error = new Error('请选择精确到分钟的有效删除时间');
    console.error('[Message Roaming Time Delete] 时间前置条件不满足', {
      selectedRoamingMessageDeleteTimestamp:
        selectedRoamingMessageDeleteTimestamp.value,
      error,
    });
    ElMessage.error(error.message);
    return;
  }

  const selectedMinute = formatRoamingMessageDeleteMinute(beforeTimestamp);
  try {
    await ElMessageBox.confirm(
      `将删除当前会话在 ${selectedMinute} 之前的服务端漫游消息。此操作以 SDK 和服务端实际结果为准，确认继续吗？`,
      '二次确认删除漫游消息',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('[Message Roaming Time Delete] 二次确认弹窗失败', {
        conversationId,
        conversationType,
        beforeTimestamp,
        error,
      });
    }
    return;
  }

  roamingMessageTimeDeleteLoading.value = true;
  try {
    await store.dispatch('removeMessageRoamingBeforeTimestamp', {
      conversationId,
      conversationType,
      beforeTimestamp,
    });
    store.commit('CLEAR_SOMEONE_MESSAGE', conversationId);
    historyMessageCursor.value = -1;
    isMoreHistoryMsg.value = true;
    await fechHistoryMessage('fistLoad', { throwOnError: true });
    roamingMessageTimeDeleteDialogVisible.value = false;
    ElMessage.success('SDK 删除成功，已按服务端结果重新拉取当前会话漫游消息');
  } catch (error) {
    console.error('[Message Roaming Time Delete] 删除或服务端重新拉取失败', {
      conversationId,
      conversationType,
      beforeTimestamp,
      error,
      errorCode: error?.code,
      errorDetails: error?.details,
      errorMessage: error?.message,
      errorStack: error?.stack,
    });
    ElMessage.error(
      error?.message ||
        'SDK 删除或服务端重新拉取失败，当前页面不能据此判定删除范围',
    );
  } finally {
    roamingMessageTimeDeleteLoading.value = false;
  }
};
```

此流程明确要求：`store.dispatch` reject 时不执行 `CLEAR_SOMEONE_MESSAGE`；重拉取 reject 时不显示成功 toast。不要增加任何以消息 `timestamp` 为条件的 `filter`、重试或本地回退。

- [ ] **Step 4: 在 `header_actions` 增加入口和分钟级日期时间弹窗**

在“服务端消息搜索”入口前添加：

```vue
<el-tooltip
  v-if="isRoamingMessageTimeDeleteVisible"
  content="按时间删除漫游消息"
  placement="top"
  :show-after="200"
>
  <div
    class="more roaming_message_time_delete_trigger"
    aria-label="按时间删除漫游消息"
    @click="openRoamingMessageTimeDeleteDialog"
  >
    漫游删除
  </div>
</el-tooltip>
```

在现有 `MessageSearchDrawer` 后添加：

```vue
<el-dialog
  v-model="roamingMessageTimeDeleteDialogVisible"
  title="按时间删除漫游消息"
  width="420px"
  :close-on-click-modal="!roamingMessageTimeDeleteLoading"
  :close-on-press-escape="!roamingMessageTimeDeleteLoading"
>
  <p>将删除当前会话在所选时间点之前的服务端漫游消息。</p>
  <el-date-picker
    v-model="selectedRoamingMessageDeleteTimestamp"
    type="datetime"
    format="YYYY-MM-DD HH:mm"
    time-format="HH:mm"
    value-format="x"
    placeholder="选择删除边界（精确到分钟）"
    clearable
  />
  <template #footer>
    <el-button
      :disabled="roamingMessageTimeDeleteLoading"
      @click="roamingMessageTimeDeleteDialogVisible = false"
    >
      取消
    </el-button>
    <el-button
      type="danger"
      :loading="roamingMessageTimeDeleteLoading"
      @click="confirmRoamingMessageTimeDelete"
    >
      下一步
    </el-button>
  </template>
</el-dialog>
```

- [ ] **Step 5: 运行 UI 合同测试和邻近历史加载回归**

Run: `node tests/specs/unit/sdk5-roaming-message-time-delete-ui-contract-spec.cjs && node tests/specs/unit/sdk5-history-and-unread-contract-spec.cjs`

Expected: 依次输出 `sdk5 roaming message time-delete UI contract: PASS` 和 `sdk5 history and unread contract: PASS`。

### Task 5: 同步真实能力文档并建立文档红绿合同

**Files:**
- Create: `tests/specs/unit/sdk5-roaming-message-time-delete-docs-contract-spec.cjs`
- Modify: `cases_list.md:消息-展示与交互`
- Modify: `.codex/prompts/superpowers.md:107`
- Modify: `docs/sdk5-api-coverage.md:20-24`
- Test: `tests/specs/unit/sdk5-roaming-message-time-delete-docs-contract-spec.cjs`

**Interfaces:**
- Consumes: 已实现的 Store action 与页面入口。
- Produces: 与源码一致的用户可见能力、SDK 调用边界和真实验证限制描述。

- [ ] **Step 1: 写入先失败的文档合同测试**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const casesList = read('cases_list.md');
const rules = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');

for (const source of [casesList, rules, coverage]) {
  assert.match(source, /按时间删除.*漫游消息/);
  assert.match(source, /beforeTimestamp/);
  assert.match(source, /单聊.*群聊|群聊.*单聊/);
  assert.doesNotMatch(source, /按时间删除[^\n]{0,360}\/notify/);
}
assert.match(coverage, /静态.*不等价于.*真实服务端|真实服务端.*验证/);

console.log('sdk5 roaming message time-delete docs contract: PASS');
```

- [ ] **Step 1a: 将文档合同收紧为两条删除路径和真实验证边界**

在文档合同测试的 `console.log` 前加入以下精确断言。先运行它并确认因当前矩阵/文档缺少这些说明而红灯，再修改文档；不能为了转绿而删除禁用语义。

```js
const timeDeleteRequirements = [
  /按时间删除.*漫游消息/,
  /非话题/,
  /单聊.*群聊|群聊.*单聊/,
  /二次确认/,
  /beforeTimestamp/,
  /removeHistoryMessages/,
  /getHistoryMessages/,
  /messageIds/,
  /本地.*timestamp.*过滤/,
  /REST notify/,
  /自动重试/,
  /reject|拒绝|失败/,
];
for (const requirement of timeDeleteRequirements) {
  assert.match(
    casesList,
    requirement,
    `cases_list.md 缺少按时间删除真实边界：${requirement}`,
  );
  assert.match(
    rules,
    requirement,
    `.codex/prompts/superpowers.md 缺少按时间删除真实边界：${requirement}`,
  );
  assert.match(
    coverage,
    requirement,
    `docs/sdk5-api-coverage.md 缺少按时间删除真实边界：${requirement}`,
  );
}
assert.match(
  coverage,
  /messageIds[\s\S]*?beforeTimestamp|beforeTimestamp[\s\S]*?messageIds/,
  '覆盖矩阵必须同时说明按消息 ID 和按时间两条 removeHistoryMessages 路径。',
);
```

### Task 5b: 修复覆盖矩阵与文档合同缺口

**Files:**
- Modify: `tests/specs/unit/sdk5-roaming-message-time-delete-docs-contract-spec.cjs`
- Modify: `cases_list.md:消息-展示与交互`
- Modify: `.codex/prompts/superpowers.md:107-108`
- Modify: `docs/sdk5-api-coverage.md:20,64`
- Test: `tests/specs/unit/sdk5-roaming-message-time-delete-docs-contract-spec.cjs`

**Interfaces:**
- Consumes: 已实现的按 `messageIds` 单条入口与按 `beforeTimestamp` 当前会话分钟入口。
- Produces: 文档中明确、互不冲突的两个 `removeHistoryMessages` 用户可见路径和真实验证限制。

- [ ] **Step 1: 运行增强合同，确认当前文档因缺少完整边界而失败**

Run: `node tests/specs/unit/sdk5-roaming-message-time-delete-docs-contract-spec.cjs`

Expected: `AssertionError` 指向矩阵/文档缺少 `二次确认`、`getHistoryMessages`、`自动重试` 或按 ID/按时间双路径说明之一；失败必须来自文档语义缺口。

- [ ] **Step 2: 在三个用户文档中同步相同的真实语义**

将 `cases_list.md` 的按时间条目补全为：仅非话题单聊/群聊，分钟级二次确认后以 `beforeTimestamp` 调用 SDK；不得传 `messageIds`，SDK resolve 后清缓存并真实 `getHistoryMessages` 首游标重拉；delete/reload reject 失败不显示成功；不得本地 `timestamp` 过滤、REST notify 或自动重试。

将 `.codex/prompts/superpowers.md` 的按时间规则补入“二次确认”及同一完整失败/禁止边界。

将 `docs/sdk5-api-coverage.md` 的概览和“历史、搜索、删除、撤回、编辑、合并解析”矩阵行改成两条清晰路径：

1. 消息菜单按真实 `msgServerId` 传 `messageIds: [msgServerId]`，SDK resolve 后移除当前行。
2. 当前会话顶部按分钟选择和二次确认后仅传 `beforeTimestamp`；SDK resolve 后清缓存并真实 `getHistoryMessages` 重拉。

矩阵行必须说明两者均限单聊/群聊、不能使用聊天室、`msgLocalId`、REST notify、本地 `timestamp` 过滤或自动重试；静态覆盖和构建不等于真实服务端 PASS。不要改变 `192 / 204`、`94.1%`、`12`，同一公开 API 仍只计一次。

- [ ] **Step 3: 运行增强后的文档合同测试**

Run: `node tests/specs/unit/sdk5-roaming-message-time-delete-docs-contract-spec.cjs`

Expected: `sdk5 roaming message time-delete docs contract: PASS`。

- [ ] **Step 2: 运行测试，确认当前文档尚未把本功能声明为已实现**

Run: `node tests/specs/unit/sdk5-roaming-message-time-delete-docs-contract-spec.cjs`

Expected: `AssertionError` 指向缺少“按时间删除漫游消息”；不修改既有按消息 ID 删除的文档语义。

- [ ] **Step 3: 按以下真实边界同步三份文档**

在 `cases_list.md` 的消息能力项补入：

```text
按时间删除当前会话漫游消息（仅非话题的单聊/群聊；在消息页顶部“更多操作”选择精确到分钟的 `beforeTimestamp` 并二次确认后，调用 `ChatManager.removeHistoryMessages({ conversationId, conversationType, beforeTimestamp })`；SDK resolve 后清空当前缓存并从首游标重新拉取服务端结果；拒绝或重拉失败保留原始错误，不以本地时间过滤或 `/notify` 伪造结果）
```

在 `.codex/prompts/superpowers.md` 的现有“删除漫游消息”规则后增加独立 bullet：

```text
当前会话顶部“更多操作”的按时间删除漫游消息仅对非话题单聊/群聊展示；日期控件只允许选择到分钟，使用该分钟起点的 `beforeTimestamp` 调用 `ChatManager.removeHistoryMessages({ conversationId, conversationType, beforeTimestamp })`。不得传 `messageIds`、调用 `/notify` 或按本地 `timestamp` 过滤。SDK resolve 后清空该会话缓存并真实 `getHistoryMessages` 重拉；SDK delete/reload reject 都必须输出原始参数和 error，且不得显示删除成功或自动重试。
```

在 `docs/sdk5-api-coverage.md` 的概览说明后增加说明：`ChatManager.removeHistoryMessages` 现已同时由按 `messageIds` 的单条入口和按 `beforeTimestamp` 的当前会话分钟级入口调用；后者的静态覆盖只证明页面调用路径存在，真实删除范围仍需以 SDK response 与重新拉取结果验证。不要改变 API 覆盖数字，因为同一个公开 API 已被按消息 ID 入口计入覆盖。

- [ ] **Step 4: 运行文档合同测试**

Run: `node tests/specs/unit/sdk5-roaming-message-time-delete-docs-contract-spec.cjs`

Expected: `sdk5 roaming message time-delete docs contract: PASS`。

### Task 6: 完整验证与真实场景交接

**Files:**
- Verify: `src/store/modules/message.js`
- Verify: `src/views/Chat/components/Message/index.vue`
- Verify: `tests/specs/unit/sdk5-roaming-message-time-delete-*-contract-spec.cjs`
- Verify: `cases_list.md`
- Verify: `.codex/prompts/superpowers.md`
- Verify: `docs/sdk5-api-coverage.md`

**Interfaces:**
- Consumes: 完成的 SDK 5.0 Store 调用、页面交互和同步文档。
- Produces: 本地静态/构建证据，以及清晰标记为待真实服务端执行的验证步骤。

- [ ] **Step 1: 运行新旧合同测试与覆盖统计**

Run:

```bash
node tests/specs/unit/sdk5-roaming-message-time-delete-store-contract-spec.cjs
node tests/specs/unit/sdk5-roaming-message-time-delete-ui-contract-spec.cjs
node tests/specs/unit/sdk5-roaming-message-time-delete-docs-contract-spec.cjs
node tests/specs/unit/sdk5-roaming-message-delete-contract-spec.cjs
node tests/specs/unit/sdk5-history-and-unread-contract-spec.cjs
node tests/specs/unit/sdk5-message-expanded-capabilities-contract-spec.cjs
node tests/specs/unit/sdk5-event-center-contract-spec.cjs
node scripts/sdk5-api-coverage.cjs
git diff --check
```

Expected: 所有合同输出 `PASS`；覆盖脚本成功完成且 `removeHistoryMessages` 仍为已覆盖 API；`git diff --check` 无输出。

- [ ] **Step 2: 构建 Demo**

Run: `yarn build`

Expected: exit code `0`。若只有既有 bundle-size warning，记录为 warning；不把构建成功表述成服务器删除已通过。

- [ ] **Step 3: 执行真实单聊/群聊验证，不模拟结果**

1. 用真实账号登录，在一个单聊和一个群聊中分别准备至少三条时间跨越所选分钟边界的服务端漫游消息。
2. 打开当前会话顶部“更多操作”，确认聊天室和话题没有入口，单聊和群聊有“漫游删除”入口。
3. 选择 `YYYY-MM-DD HH:mm`，检查日期控件没有秒输入；点击“下一步”，确认二次弹窗显示同一个分钟边界。
4. 确认后在 Console 保存 `ChatManager.removeHistoryMessages` 的 `mode: 'beforeTimestamp'`、`conversationId`、`conversationType`、`beforeTimestamp` 和原始 response/error；Network 只作为 SDK 请求佐证，不调用页面 REST `/notify`。
5. SDK resolve 后，观察页面清空缓存并从首游标触发真实 `ChatManager.getHistoryMessages`；以重新拉取的数据验证服务端对“之前”的实际边界。
6. 对 SDK/server 错误响应执行一次，确认原消息和游标不在删除请求 reject 时被清空；对重拉取错误执行一次，确认页面不显示删除成功且 Console 保留原始错误。
7. 若真实服务端结果与 `beforeTimestamp` 的 SDK 类型契约冲突，记录为 SDK/服务端缺陷，不以 Demo 逻辑修补。

- [ ] **Step 4: 保持工作区未提交**

Run: `git status --short`

Expected: 仅展示本任务和已存在的本地修改；不执行暂存、提交、推送、重置、清理或覆盖操作。
