# 单聊历史消息入库顺序修复设计

## 目标

确保 WebSDK 5.0 `ChatManager.getHistoryMessages` 的成功结果在页面结束本次历史加载前已写入当前会话的 Vuex 消息列表，避免用户返回会话列表后重新进入单聊时出现 SDK 已返回消息、页面暂未展示的时序窗口。

## 根因与边界

当前 `getHistoryMessage` 在处理成功响应时先调用 `resolve({ messages, cursor, hasMore })`，随后才反转消息并提交 `UPDATE_HISTORY_MESSAGE`。调用方因此可以在 Store 写入前继续执行加载完成、滚动和路由相关逻辑。

本次仅调整 Demo 内部的完成顺序：保留 SDK 5.0 返回的 `items`、消息字段、会话 ID、会话类型和原始失败；不重试、不补造消息、不恢复 SDK 4.0 字段，也不改变历史消息排序或分页参数。

## 方案

`getHistoryMessage` 成功后依次执行：

1. 读取并记录原始 SDK 5.0 响应。
2. 将 `items` 反转后提交 `UPDATE_HISTORY_MESSAGE`，并完成用户扩展信息和真实已读回执处理。
3. 记录 Store 中该 `conversationId` 的已写入数量与消息 ID。
4. 最后 resolve 给页面，返回的 `messages`、`cursor`、`hasMore` 保持原值。

## 验收

- 历史请求 resolve 时，`state.messageList[conversationId]` 已有本批带 `msgServerId` 或 `msgLocalId` 的消息。
- 单聊返回会话列表再进入时，SDK 返回的历史消息继续按 SDK 返回结果展示。
- 历史请求失败仍原样 reject 和打印 SDK 原始错误。
- 运行现有历史消息、核心消息模型、SDK5 迁移契约与构建验证。
