# 单会话右键清空未读设计

## 目标

保留点击进入单聊或群聊时已有的自动清空未读行为，并在对应会话的右键菜单中增加显式的“清空未读”操作，便于不进入会话也能验证 WebSDK 5.0 的单会话未读清零能力。

## 范围与边界

- 右键菜单仅对 `singleChat` 和 `groupChat` 展示“清空未读”。
- 聊天室不展示该项：WebSDK 5.0 `ChatManager.clearConversationUnreadMessageCount` 的参数类型只支持单聊和群聊。
- 手动操作调用现有 Vuex `clearConversationUnreadCount`，其唯一 SDK 路径为 `ChatManager.clearConversationUnreadMessageCount({ conversationId, conversationType })`。
- 仅在 SDK Promise 成功后提交 `CLEAR_CONVERSATION_ITEM_UNREAD_COUNT`；SDK reject 时保留现有未读数、输出完整错误并由菜单 UI 显示失败 toast。
- 点击会话后的自动清零保持为非阻塞请求，路由跳转顺序和已读回执边界不改变。

## 交互与验证

右键单聊或群聊会话可看到“清空未读”。点击后该菜单项进入 loading 状态，完成后显示成功 toast；失败时显示 SDK 的原始错误信息。契约测试应同时锁定：菜单项存在且仅限单聊/群聊、手动路径等待 SDK 调用、自动进入会话路径仍不等待该调用。
