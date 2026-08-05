# 群邀请可观测性设计

## 目标

补齐 WebSDK 5.0 群邀请链路的发送端日志，并提供单聊、群组、聊天室真实事件的统一展示，方便区分“邀请请求已被服务端接受”与“受邀者已收到 SDK 事件”。

## 范围

- 发送端在 `groupManager().inviteUsersToGroup({ groupId, userIds })` 的 Promise 成功后输出 `groupId`、`userIds`、当前用户和 SDK 原始 `void` 结果。
- 失败时继续输出同一请求上下文和 SDK 原始错误。
- 接收端继续只依赖 SDK 5.0 `onInvitationReceived` 或 `onAutoAcceptInvitationFromGroup` 的原始回调；回调到达才记录系统通知。
- 所有单聊、群组和聊天室监听在 SDK 回调到达时，将 `{ domain, eventName, payload, receivedAt, currentUserId }` 写入 Vuex 事件记录；`payload` 保持 SDK 原始结构。
- 复用“新通知”路由提供事件中心，可按单聊、群组、聊天室筛选，展示事件名称、时间、目标 ID、当前用户和完整原始 payload。
- 不添加 REST 回退、重试、合成本地通知或本地入群成功状态。

## 验证

静态回归测试必须断言发送成功日志、三类事件记录和两种接收端群邀请事件日志均存在；双账号实测中，HTTP/Promise 成功与接收事件分别记录。若接收端在线且没有事件，报告为 SDK/服务端事件未下发。
