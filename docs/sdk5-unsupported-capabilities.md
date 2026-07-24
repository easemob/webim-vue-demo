# SDK 5.0 未支持能力记录

本文件记录当前 Demo 安装的 `easemob-websdk 5.0.2` 没有公开 API，或真实 SDK / 服务端行为与公开契约不一致的现有 Demo 功能。

规则：页面保留入口时，必须展示真实的 SDK 5.0 不支持错误并保留控制台上下文；禁止回退 Web SDK v4、REST 或 mock。每次发现新的缺口，追加旧入口、SDK 5.0 公开 API 核验、页面行为和验证状态。

| 能力 | 原 Demo 入口 | SDK 5.0 公开 API 核验 | 当前页面行为 | 状态 |
| --- | --- | --- | --- | --- |
| 解散聊天室 | 聊天室列表、聊天室详情的“解散聊天室”操作 | `ChatRoomManager` 公开 API 不含 `destroyChatRoom` | 用户确认后显示 `SDK 5.0 current package does not expose destroyChatRoom; no fallback is configured.`，控制台保留原始错误 | 已确认不支持 |
| 创建聊天室 | 导航“创建聊天室”表单 | `ChatRoomManager` 公开 API 不含 `createChatRoom` | 提交时显示 `SDK 5.0 current package does not expose createChatRoom; no fallback is configured.`，不创建本地聊天室 | 已确认不支持 |
| 查询已加入聊天室列表 | 聊天室列表“已加入”分类 | `ChatRoomManager` 公开 API 不含 `getJoinedChatRooms` | 不再通过公开聊天室列表逐个调用 `getChatRoomInfo` 推测成员关系；列表只展示 SDK 返回的公开聊天室，单个详情页仅按该聊天室 `permissionType` 展示真实成员关系 | 已确认不支持 |
| 聊天室消息免打扰 | 聊天室详情“消息免打扰”开关 | `ChatRoomManager` 不含当前用户的聊天室会话静音 API；`pushManager` 的会话静音能力和 SDK 会话静音列表均不支持 `chatRoom`。`muteMembers` / `muteAllMembers` 是管理员禁言成员，不等同消息免打扰 | 移除旧开关，不向 `pushManager` 传入 `chatRoom`，不显示本地成功状态 | 已确认不支持 |
| 举报消息 | 无页面入口 | `ChatManager` 公开 API 不含 `reportMessage` | Demo 不提供消息举报入口，不以旧 SDK、REST 或本地错误弹窗模拟该能力 | 已确认不支持 |
| 下载 SDK 缓存日志 | 个人设置“下载 SDK 日志” | 公开入口只有 `setLogLevel`，不含日志缓存/下载 API | 点击时显示 `SDK 5.0 current package does not expose log download; no fallback is configured.` | 已确认不支持 |
| 屏蔽/取消屏蔽群消息 | Demo 无入口 | SDK 5.0 无公开 `Group` / `GroupManager` API 提供 `blockGroupMessage` / `unblockGroupMessage` | 已删除旧入口；不保留本地屏蔽状态，也不以旧 SDK、REST 或 mock 替代 | 已确认不支持 |
| 聊天室合并消息下行 | 聊天室输入框“发送合并消息” | `ChatManager.createCombineMessage` 的类型声明允许 `conversationType: 'chatRoom'`，但以 5.0.1 历史包在 NGI 聊天室实测：发送端返回成功，接收事件实际为 `type: 'text'`，内容为 SDK 的兼容文本“版本过低”，而非 `type: 'combine'`；当前 5.0.2 包需重新实测 | 页面如实展示 SDK 下行的文本兼容内容；不把文本伪造为合并消息 | 5.0.1 历史包/服务端组合实测不通过；5.0.2 待复测 |
| EaseCallKit 查询频道成员 | EaseCallKit 多人通话频道成员展示 | `ChatClient` 公开 `getRTCTokenInfo` 与 `getUserIdsWithRTCUids`，但不公开按频道名查询成员列表的 API；旧实现直接请求 REST `/channel/mapper` | 组件打印并抛出 `WebSDK 5.0.2 does not expose a channel-member query API for EaseCallKit.`；不再调用旧 REST 客户端或伪造成员列表 | 已确认不支持 |
