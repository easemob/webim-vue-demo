# 独立删除漫游消息入口设计

## 目标

在消息操作菜单提供明确的“删除漫游消息”入口，使用 WebSDK 5.0 公开的 `ChatManager.removeHistoryMessages` 按真实服务端消息 ID 删除当前单聊或群聊的一条漫游消息，并暴露真实删除结果及其他设备收到的删除事件。

## 范围与边界

- 将现有歧义的消息菜单项“删除”改为“删除漫游消息”，不保留两个执行同一服务端删除动作的入口。
- 仅当 `conversationType` 为 `singleChat` 或 `groupChat` 时展示该菜单项；`chatRoom` 不展示，也不调用该 API。
- 仅当原始 SDK 5.0 Message 有非空 `msgServerId` 时允许删除。缺失时显示真实前置条件错误并停止，不以 `msgLocalId` 代替。
- 二次确认文案明确说明：删除的是服务端漫游记录，不能以本地 UI 状态代替服务端成功。
- 调用 `removeHistoryMessages({ conversationId, conversationType, messageIds: [msgServerId] })`；只有 Promise resolve 后，才从当前消息列表移除该条消息。
- 失败时保留完整 SDK 原始错误和调用参数，不删除本地消息、不重试、不调用未公开的 `/notify` 接口。
- 删除发起端只验证删除 REST 结果；其他在线资源收到服务端真实 `onMultiDeviceMessageRemoved` 时，记录原始事件。SDK 未下发事件时不伪造。

## 组件与数据流

```text
消息操作菜单（单聊/群聊 + msgServerId）
  → “删除漫游消息”确认框
  → Vuex removeMessageRoaming
  → ChatManager.removeHistoryMessages
  → SDK resolve：移除当前消息行；SDK reject：保留原消息和原始错误

其他资源的 MSync roaming_delete 下行
  → ChatManager.onMultiDeviceMessageRemoved
  → Console 原始事件 + 统一事件中心记录
```

## 修改位置

- `src/views/Chat/components/Message/components/ChatMessageListItem/index.vue`
  - 以 SDK 原始 `conversationType` 和 `msgServerId` 决定入口是否显示。
  - 将确认、调用和提示改为“删除漫游消息”的明确语义。
- `src/store/modules/message.js`
  - 将删除 action 收敛为 `removeMessageRoaming`，校验 `conversationId`、`conversationType`、`msgServerId`。
  - 用 `msgServerId` 作为唯一 `messageIds` 值，成功后才提交现有消息删除 mutation。
- `src/IM/listener/imMultiDeviceListener.js`
  - 在现有命名 `ChatManager` 监听器中直接注册 `onMultiDeviceMessageRemoved`。
  - 输出 `conversationId`、`conversationType`、`messageIds`、`beforeTimestamp`、`deviceId` 和原始事件，并写入统一事件中心；不改写 SDK 事件字段。
- `tests/specs/unit/sdk5-roaming-message-delete-contract-spec.cjs`
  - 覆盖入口显示范围、`msgServerId` 前置条件、SDK 调用参数、成功后删除本地展示、失败保留展示、多端事件监听和文档描述。
- `cases_list.md`、`.codex/prompts/superpowers.md`
  - 同步当前 Demo 已实现的单聊/群聊漫游消息删除及真实多端事件验证边界。

## 验收与验证

### 静态合同验证

- 菜单文案为“删除漫游消息”，且聊天室没有该入口。
- 请求参数仅来自 `msgServerId`，源文件不存在 `msgServerId || msgLocalId` 用于漫游删除的回退写法。
- SDK 调用固定为 `removeHistoryMessages({ conversationId, conversationType, messageIds: [msgServerId] })`。
- `onMultiDeviceMessageRemoved` 通过命名 ChatManager 监听器记录原始 SDK 事件。

### 真实双端验证

1. 同一账号以两个不同 `resource` 登录 A、B。
2. 在 A 的单聊和群聊各拉到一条具有 `msgServerId` 的真实漫游消息。
3. A 点击“删除漫游消息”并确认，检查 Network 中的漫游 `DELETE` 成功。
4. A 再拉取漫游消息，确认该消息不返回。
5. B 检查真实 `onMultiDeviceMessageRemoved` 事件及其 `messageIds`；未下发时记录为服务端/SDK 未验证，不能本地伪造成功。

## 非目标

- 不新增直接 `POST /api/easemob.com/{org}/{app}/notify` 的客户端调用。
- 不提供聊天室漫游删除入口。
- 不将“删除会话（含全部漫游）”改造成按消息 ID 删除。
- 不实现本地删除替代服务端删除，也不增加自动重试。
