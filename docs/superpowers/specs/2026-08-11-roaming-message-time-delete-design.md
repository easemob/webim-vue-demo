# 按时间删除当前会话漫游消息设计

## 目标

在当前单聊或群聊会话顶部的“更多操作”区增加“按时间删除漫游消息”入口。用户在页面选择精确到分钟的时间，经过二次确认后，Demo 只调用 WebSDK 5.0 公开的 `ChatManager.removeHistoryMessages` 删除当前会话所选时间点之前的服务端漫游消息，并如实展示 SDK 成功、失败和重新拉取结果。

## 已确认交互与 SDK 语义

- 入口位于当前会话顶部的“更多操作”区，不放在单条消息菜单中。
- 只在普通单聊和群聊会话展示；聊天室和消息话题会话不展示，也不调用该 API。
- 首个弹窗使用单个日期时间选择器，页面精度固定为分钟，显示格式为 `YYYY-MM-DD HH:mm`。
- 选择 `2026-08-11 14:30` 时，取该分钟的起点 `2026-08-11 14:30:00.000` 所对应的毫秒时间戳作为 `beforeTimestamp`。
- 选择器确认后必须再出现一个危险二次确认弹窗，明确显示所选时间和“删除该时间点之前的服务端漫游消息”的含义。
- SDK 公开类型的真实语义是 `beforeTimestamp`：删除该毫秒时间戳之前的历史消息。Demo 不将其解释为“删除该分钟内的全部消息”，也不自行推断等于该时间点或更晚消息的服务端结果。

## 调用边界

唯一的删除请求为：

```js
chatManager().removeHistoryMessages({
  conversationId,
  conversationType,
  beforeTimestamp,
});
```

- `conversationId`、`conversationType` 直接取当前路由会话的 WebSDK 5.0 字段。
- 此调用不传 `messageIds`，不复用按单条 `msgServerId` 删除的 action，也不改变该 action 的语义。
- 未选择时间、时间无法转换为正毫秒值、会话 ID 缺失或会话类型不支持时，禁止发起 SDK 调用，并展示明确前置条件错误。
- 不调用 REST `/notify`、不使用私有 SDK 能力、不自动重试、不使用本地成功模拟或 SDK 4.0 兼容代码。
- 分支硬门禁：`src/` 运行代码不得存在或新增 SDK 4.0 路径，例如 `EMClient`、`WebIM`、`conn`、`chatType`、`mid`、`msg` 等旧 SDK 调用/消息模型别名；缺失 SDK 5.0 数据必须以原始结果展示，不能用旧字段兼容。

## 组件与数据流

```text
当前会话顶部“更多操作”（单聊/群聊）
  → “按时间删除漫游消息”
  → 分钟级日期时间选择弹窗
  → 显示精确边界的二次危险确认
  → Vuex removeMessageRoamingBeforeTimestamp
  → ChatManager.removeHistoryMessages({ conversationId, conversationType, beforeTimestamp })
  → SDK resolve：清空当前会话缓存和历史游标，真实 getHistoryMessages 重新拉取
  → SDK reject：保留消息与游标，输出原始错误
```

## 缓存刷新与失败处理

SDK resolve 后，Demo 不按照本地 `timestamp` 过滤当前消息列表，因为这会把客户端对删除边界的猜测伪装为服务端结果。取而代之：

1. 清空当前会话的本地消息缓存，并重置该组件的历史游标和“是否还有更多消息”状态。
2. 立即调用真实 SDK `getHistoryMessages` 从首游标重新拉取该会话。
3. 新列表只展示服务端实际返回的数据。

如果删除请求失败，或删除成功后的重新拉取失败：

- 记录 API 名称、完整请求参数、原始 `response` 或 `error` 到 Console；错误日志包含可用的 `code`、`details`、`message` 和 `stack`。
- 删除请求失败时不清空本地消息和游标。
- 重新拉取失败时，保留该失败事实和错误提示；不得把缓存清空视作服务端删除结果，也不得重试或用旧数据伪造刷新成功。

## 修改位置

- `src/views/Chat/components/Message/index.vue`
  - 新增顶部入口、分钟级日期时间选择弹窗、二次确认、支持范围判断和服务端重新拉取编排。
- `src/store/modules/message.js`
  - 新增独立的 `removeMessageRoamingBeforeTimestamp` action；负责校验、真实 SDK 调用和原始日志，不提交按时间本地删除 mutation。
- `tests/specs/unit/sdk5-roaming-message-time-delete-contract-spec.cjs`
  - 固定入口范围、分钟格式、二次确认、`beforeTimestamp` 专用调用、无 `messageIds`/REST/本地时间过滤，以及失败状态保留等合同。
- `cases_list.md`
  - 记录当前可见的按时间删除会话漫游消息能力与“实际删除结果需依服务端重新拉取验证”的边界。
- `.codex/prompts/superpowers.md`
  - 同步 SDK 5.0 专用调用、分钟边界、无本地伪造和真实日志规则。
- `docs/sdk5-api-coverage.md`
  - 将 `removeHistoryMessages` 的按时间参数路径标为已实现 UI 入口；静态验证与真实服务端验证状态分开描述。

## 验收与验证

### 静态和构建验证

- 合同测试验证入口仅覆盖单聊/群聊，且日期控件的用户可选精度是分钟。
- 合同测试验证调用只传 `conversationId`、`conversationType`、`beforeTimestamp`，不在该路径传 `messageIds` 或请求 `/notify`。
- 合同测试验证删除成功不会通过本地时间比较过滤消息；重新获取走 SDK `getHistoryMessages`。
- 运行相关现有消息、事件中心合同测试、`git diff --check` 与 `yarn build`。

### 真实服务端验证

1. 在单聊或群聊中准备多条具有不同发送时间的真实漫游消息。
2. 在当前会话顶部打开“更多操作”，选择一个精确到分钟的时间，例如 `14:30`，确认 SDK 请求参数包含该分钟起点的毫秒 `beforeTimestamp`。
3. 在二次确认后检查 Network、Console 中 SDK 的真实请求和响应。
4. 等 SDK resolve 后，检查该会话从首游标重新拉取的真实服务端消息是否符合服务端定义的“之前”边界。
5. 构造 SDK/server reject，确认页面保留现有消息与游标、Console 有原始错误，且没有重试或 REST 兜底。
6. 在聊天室和话题会话确认无入口、无调用。

静态合同与本地构建只能证明 Demo 的调用路径，不代表真实服务器删除行为已经通过验证。

## 非目标

- 不增加按用户删除全部漫游消息、REST `/notify` 调用或查询单聊漫游详情的入口。
- 不改变现有“按消息 ID 删除一条漫游消息”功能。
- 不提供聊天室或话题会话的按时间删除。
- 不提交、暂存、推送、重置、清理或覆盖工作区内已有修改。
