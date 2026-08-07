# 离线消息 Read ACK 真实场景设计

## 目标

让 Demo 能够基于 WebSDK 5.0 的真实离线同步事件、真实消息 `isOnline` 字段和真实 `sendMessageReadReceipts` 请求，完整观察离线消息被用户查看后的 Read ACK 链路。

## 已确认的 SDK 5.0 事实

- `ChatClient` 连接事件提供 `onOfflineMessageSyncStart` 与 `onOfflineMessageSyncFinish`，两者均没有事件载荷。
- `Message.isOnline === false` 是 SDK 下发的离线消息标识；字段缺失不是离线证据。
- `ChatManager.sendMessageReadReceipts({ conversationId, conversationType, messageIds })` 仅支持同一会话内的单聊或群聊接收消息；消息原始发送方才会收到 `onMessageReadReceipts`。
- 聊天室不支持消息已读回执。

## 方案选择

采用“原始事件与字段可观测 + 复用已存在的渲染后回执入口”。

- 在现有连接监听器中注册真实离线同步开始/结束事件；每次真实回调同时写入事件中心的“连接事件”分类并打印当前账号、事件名和原始 `undefined` payload。
- 接收消息日志明确输出原始 `isOnline`。消息项只有在 `isOnline === false` 时显示“SDK 离线同步消息”；字段为 `true` 或缺失时不显示标签、不推断离线状态。
- 消息页仍仅在消息完成渲染后，把原始接收消息交给现有 `sendIncomingMessageReadReceipt`。它继续只筛选 `direct: 'RECEIVE'`、`needReadReceipt: true`、`msgServerId` 完整的单聊/群聊消息，并调用公开 SDK API。不会因消息是离线同步消息走另一条 API 或本地成功分支。
- 发送方继续只根据真实 `onMessageReadReceipts` 回调更新已读状态；不增加本地 `✓✓`、定时器、重试或离线模拟入口。

## 失败与缺失处理

- SDK 未触发离线同步事件、未下发 `isOnline`，或 API 请求失败时，仅保留真实日志/事件/错误；Demo 不补造离线标签、事件或回执成功。
- 聊天室消息无论是否 `isOnline === false` 都不进入 Read ACK 调用。
- 静态契约和构建只能证明 Demo 调用路径；两账号离线同步、SDK 请求和发送方回调仍须在真实服务端环境单独验证。

## 两账号真实验证步骤

1. A 在线，向 B 的单聊或群聊发送带 `needReadReceipt: true` 的消息，记录 `msgServerId`。
2. B 处于离线状态，确认未实时收到该消息。
3. B 登录或恢复连接，观察真实 `onOfflineMessageSyncStart`、`onOfflineMessageSyncFinish`；若消息原始对象下发 `isOnline === false`，确认页面只据此显示离线同步标签。
4. B 进入该会话并完成消息渲染，观察 `ChatManager.sendMessageReadReceipts` 的真实 request / response 或 failed 日志。
5. A 观察真实 `ChatManager.onMessageReadReceipts` 原始回调，再确认 UI 展示 `✓✓`。
6. 对聊天室重复离线同步场景，确认不会出现 Read ACK SDK 请求。

## 非目标

- 不提供“模拟离线”“强制标记离线”或“手动伪造回执”按钮。
- 不使用 REST、SDK 4.0 字段、兼容层、自动重试、缓存补值或本地状态模拟服务端成功。
- 不将静态契约或本地构建描述为真实服务端验证通过。
