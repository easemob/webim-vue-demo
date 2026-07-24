# ChatClient.sendMessage SDK 5.0 覆盖设计

## 目标

为 WebSDK 5.0.1 的公开 API `ChatClient.sendMessage(message, options)` 增加一个独立且可见的真实测试入口。该入口只覆盖当前会话的文本消息发送，不改变现有 `ChatManager.sendMessage` 入口，也不把其中任一入口的结果记作另一个 API 的覆盖结果。

## 范围

- 增加当前消息输入区的第二个文本发送按钮，明确标识 `SDK5 Client.sendMessage`。
- 支持当前路由提供的 SDK 5.0 `conversationId` 与 `conversationType`，由真实 SDK 决定单聊、群聊或聊天室是否可以发送。
- 使用 SDK 5.0 `chatManager.createTextMessage` 构造原始 `Message`，再直接使用 `getClient().sendMessage(message, options)` 发送。
- 复用现有文本输入、消息扩展、在线消息选项及群已读回执选项；不另建 V4 形状的请求或消息模型。
- 同步更新 API 覆盖矩阵、用例清单和项目规则说明；新增契约回归用例。

本次不新增图片、文件、语音、视频等消息类型的 `ChatClient.sendMessage` 入口，不改造现有 `ChatManager.sendMessage` 路径，不修改接收监听或消息 Store。

## 交互与数据流

现有“发送”按钮保持不变：

```text
输入内容 -> chatManager.createTextMessage -> chatManager.sendMessage
```

新增按钮走独立链路：

```text
输入内容 -> chatManager.createTextMessage -> client.sendMessage -> SDK 原始 Message 回包 -> 现有消息列表
```

两条链路共用同一份 SDK 5.0 构造参数，但最终发送方法必须不同。新按钮只在 SDK Promise 成功后将回包交给现有 `senedShowTypeMessage` Store action；失败时保留输入内容，展示正常错误反馈，并输出带有 `ChatClient.sendMessage`、会话 ID、会话类型、原始 Message 与原始错误的 Console 日志。

## 错误与真实结果规则

- 不得在 `client.sendMessage` 失败后重试、改走 `chatManager.sendMessage` 或写入本地成功消息。
- 不得将 SDK 5.0 回包转换为 V4 `to/from/chatType/mid/msg` 字段。
- SDK 或服务端拒绝某种会话类型、参数或消息内容时，页面只展示真实失败；该失败可记录为 SDK/服务端缺陷，不通过客户端补值或兼容掩盖。
- Console 成功和失败日志都必须保留原始 SDK payload，方便区分两个发送 API 的真实链路。

## 覆盖与验证

静态回归用例应断言：

- SDK 封装存在直接的 `getClient().sendMessage(message, options)` 调用。
- 该封装不包含 `chatManager.sendMessage` fallback。
- 文本消息组件存在标识为 `SDK5 Client.sendMessage` 的独立按钮，并调用该封装。
- 现有普通“发送”按钮仍调用 `ChatManager.sendMessage` 路径。

真实验证按单聊、群聊、聊天室分别执行：输入相同格式的文本，通过新按钮发送，检查发送端 SDK 原始成功或失败日志、接收端 `onMessage` 原始回调和 UI 展示。静态契约测试或页面按钮存在只证明源码覆盖；无真实账号和服务器回包时，覆盖矩阵应标注为“已接入，真实未验证”，不得标记为真实通过。

## 文档同步

- `docs/sdk5-api-coverage.md`：`ChatClient.sendMessage` 从“否”更新为“已接入”，并明确真实验证状态。
- `cases_list.md`：新增当前会话文本 `ChatClient.sendMessage` 用例及单聊、群聊、聊天室验证要求。
- `.codex/prompts/superpowers.md`：同步此入口的 SDK 5.0 原始结果、无 fallback 规则。
