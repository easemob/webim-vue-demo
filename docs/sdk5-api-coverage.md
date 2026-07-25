# WebSDK 5.0 API 覆盖统计

生成日期：2026-07-25

当前 SDK：`easemob-websdk 5.0`，来源为 `node_modules/easemob-websdk/dist/*.d.ts`。

本文档由 `scripts/sdk5-api-coverage.cjs` 基于当前安装包的公开 TypeScript 声明和当前 `src/` 可复跑扫描生成。公开对外 API 为 `205` 个、直接调用 `193` 个；本次新增本地语音文件转写、RTC UID 映射与其他平台登录 ID 三个原始 SDK 5.0 诊断入口。

## 覆盖率概览

| 指标 | 数值 | 口径 |
| --- | ---: | --- |
| API 覆盖率 | 94.1% | 按当前 `src/` 已直接调用的公开对外 API 去重数量统计，`193 / 205` |
| 已覆盖公开对外 API | 193 | 仅统计 Demo 运行代码中的真实 SDK 5.0 调用，不包含 `tests/` |
| 未覆盖公开对外 API | 12 | 仅包含当前 `src` 没有用户可见入口或真实调用的公开对外 API |
| 已剔除 `@internal` / 私有入口 | 不计入 | 研发确认 `@internal` 属于私有方法，不进入覆盖率分母，不登记为未覆盖能力 |

> 该覆盖率是静态调用覆盖率，不等价于真实服务端 PASS；真实结果仍以页面请求、SDK 回调和服务端响应为准。

## 统计口径

- “SDK API”只统计当前安装包类型声明中未标记 `@internal` 的对外函数 / 方法：`dist/index.d.ts` 顶层函数、`ChatClient`、各 Manager，以及 `Group` / `ChatRoom` / `ChatThread` 实体对象方法。
- 不把 TypeScript type、interface、常量、错误类、`private` 方法、`@internal` 方法、`bind`、raw notify 桥接、同步控制器等 SDK 私有或内部生命周期方法计入功能覆盖目标。
- `@internal` 私有入口不进入覆盖率分母、不作为未覆盖能力、不作为“部分覆盖”的扣分原因；若同一能力已经通过公开 facade 覆盖，不再因为内部转发入口未调用而降低覆盖状态。
- 覆盖来源只看 `src/` 下真实 Demo 运行代码；`tests/` 里的合约用例不计入页面功能覆盖。
- 统计脚本为 `node scripts/sdk5-api-coverage.cjs`；它以当前安装包的 SDK 5.0 声明为分母，识别直接调用、项目统一消息 builder 分派和 `Group` / `ChatRoom` / `ChatThread` facade 调用。动态属性名不会被推断为已覆盖。
- `是` 表示当前 Demo 已有真实页面 / Store / 组件入口调用对应 SDK 5.0 公开 API；`否` 表示当前 `src/` 未覆盖；`部分覆盖` 表示只覆盖该功能行里的部分公开 API 或部分会话类型。
- 覆盖率按去重后的公开 API 方法数计算；覆盖矩阵允许同一个 SDK API 因承担多个用户功能而出现在多个功能行。
- 本文档是静态 API 覆盖统计，不等价于真实服务端 PASS。真实通过 / 失败仍以页面请求、SDK 回调和服务端响应为准。

## API 总数

| 分类 | 数量 | 说明 |
| --- | ---: | --- |
| 公开对外 API | 205 | 本文主矩阵按功能归类覆盖，覆盖率按 API 名去重统计 |
| `@internal` / 私有 / 内部生命周期入口 | 不计入 | 研发确认不需要覆盖，不进入分母、不进入未覆盖项 |

## 覆盖矩阵

| 功能 | sdk_api | 功能覆盖 | 已覆盖内容 | 未覆盖 / 风险 |
| --- | --- | --- | --- | --- |
| SDK 初始化与 Manager 注册 | `ChatClient.init`, `ChatClient.use` | 部分覆盖 | `src/IM/sdk5/client.js` 通过 `ChatClient.init` 初始化并注册 `ChatManager`、`ContactManager`、`GroupManager`、`ChatRoomManager`、`ChatThreadManager`、`PresenceManager`、`PushManager`、`UserInfoManager`。 | 未单独覆盖 `ChatClient.use` 动态注册 Manager；当前 Demo 固定在初始化阶段注册。 |
| SDK 日志等级 | `setLogLevel` | 是 | 设置页 SDK 日志开关调用 `setLogLevel('error'/'debug')`。 | SDK 日志下载无公开 API，记录在 `sdk5-unsupported-capabilities.md`。 |
| 平台适配 | `createPlatformAdapter`, `detectRuntimePlatform` | 否 | 当前 Demo 使用 SDK 默认浏览器平台适配。 | 没有平台检测 / 自定义 platform adapter 页面入口。 |
| 登录、退出和当前用户 | `ChatClient.login`, `ChatClient.logout`, `ChatClient.getCurrentUserId`, `ChatClient.getServerUrlsConfig`, `ChatClient.addEventHandler`, `ChatClient.removeEventHandler` | 是 | Token 登录、退出登录、登录后初始化、当前用户读取、运行环境详情展示、连接事件监听与移除监听均已接入；连接监听注册前调用同 ID `removeEventHandler`。 | 真实连接事件下发以 SDK 回调为准；不保留重复监听或旧事件兜底。 |
| 连接状态、Token 续期与上下文读取 | `ChatClient.getConnectionState`, `ChatClient.getRestContext`, `ChatClient.renewToken`, `ChatClient.getCacheManager`, `ChatClient.getUploadAdapter`, `ChatClient.getContactSnapshot`, `ChatClient.getSelfIdsOnOtherPlatform` | 是 | 个人设置页提供 ChatClient 运行诊断、Token 续期与其他平台登录 ID 查询入口；调用 SDK 5.0 公开方法读取连接状态、REST 上下文、缓存管理器、上传适配器、联系人快照、其他设备 `userId/resource`，并由用户输入新 Token 后调用 `renewToken(token)`。 | `getRestContext()` 和 `renewToken(token)` 涉及 token，页面 / 日志只展示脱敏摘要；其他平台登录 ID 直接展示 SDK 原始数组；SDK 失败按真实错误展示。 |
| 设备资源与 RTC | `ChatClient.getClientResource`, `ChatClient.getRTCTokenInfo`, `ChatClient.getUserIdsWithRTCUids` | 是 | EaseCallKit 使用 `getClientResource` 和 `getRTCTokenInfo`；个人设置允许输入 RTC UID 数组并直接调用 `getUserIdsWithRTCUids(rtcUids)`，展示 SDK 原始 UID 到 IM 用户 ID 映射。 | 未命中 UID 不由前端补齐；真实结果以 SDK / 服务端返回为准。 |
| ChatClient 直接发消息 | `ChatClient.sendMessage` | 是 | 当前会话文本输入区提供 `SDK5 Client.sendMessage` 独立按钮；消息仍由 `ChatManager.createTextMessage` 构造为 SDK 5.0 原始 `Message`，最终直接调用 `getClient().sendMessage(message, options)`。 | 静态覆盖不等于真实 PASS；仍需分别以单聊、群聊、聊天室真实执行并保留发送端回包与接收端 `onMessage` 日志。失败不回退 `ChatManager.sendMessage`，不本地伪造成功。 |
| 消息创建与发送 | `ChatManager.createTextMessage`, `createImageMessage`, `createFileMessage`, `createVoiceMessage`, `createVideoMessage`, `createLocationMessage`, `createCmdMessage`, `createCustomMessage`, `createCombineMessage`, `sendMessage` | 是 | 文本、图片、文件、语音、视频、位置、透传、自定义、合并消息均通过 `src/IM/sdk5/chat.js` 统一转发到 SDK 5.0 builder，再调用 `sendMessage`；消息输入组件覆盖单聊、群聊、聊天室当前会话。 | 聊天室合并消息存在 SDK / 服务端真实下行退化问题，已按真实结果登记，不在前端伪造成成功 combine 下行。 |
| 定向消息 | `ChatManager.createTextMessage`, `ChatManager.sendMessage` with `receiverList` | 是 | 群组 / 聊天室定向文本消息使用 SDK 5.0 `conversationId`、`conversationType`、`receiverList` 创建并发送。 | 只覆盖定向文本；图片、文件、视频、语音等定向消息未单独提供入口。 |
| 消息事件监听 | `ChatManager.addEventHandler`, `ChatManager.removeEventHandler` | 是 | 已监听消息、撤回、编辑、回执、Reaction、多设备等 Chat 事件并按 SDK 5.0 字段入库 / 展示；每个 Chat 监听注册前都会先调用 `removeEventHandler(handlerId)` 清理同 ID 监听，再调用 `addEventHandler(handlerId, handlers)` 注册。 | 真实事件下发与字段仍以 SDK / 服务端回调为准；不使用旧事件聚合、旧字段映射或重复监听兜底。 |
| 当前会话上下文 | `ChatManager.setCurrentConversation`, `resetCurrentConversation`, `getCurrentConversation` | 是 | 进入消息页调用 `setCurrentConversation({ conversationId, conversationType })`，页面展示 `getCurrentConversation()` 的 SDK 真实返回，切换会话或离开消息页调用 `resetCurrentConversation()`。 | 用于验证 SDK 当前会话收到在线消息时不累加本地未读；真实效果仍需用单聊、群聊、聊天室在线消息分别验收并保留 console 证据。 |
| 会话列表与筛选 | `ChatManager.getConversationList`, `refreshSessionList` | 是 | 会话列表、本地筛选、置顶会话筛选均调用 `getConversationList`；会话列表顶部提供主动刷新入口，调用 `refreshSessionList({ includeEmpty: true })` 后直接展示 SDK 返回的真实会话列表。 | 真实刷新结果以 SDK / 服务端返回为准；失败不读取旧接口或用本地缓存伪造成刷新成功。 |
| 会话删除、置顶、标记、未读 | `ChatManager.deleteConversation`, `setConversationPinned`, `addConversationMark`, `removeConversationMark`, `clearConversationUnreadMessageCount`, `clearAllMessagesAndConversations`, `clearAllConversationUnreadMessageCount`, `getPinnedMessageList` | 是 | 删除会话、置顶 / 取消置顶、标星 / 取消标星、单聊和群聊单会话未读清零、全会话未读清零、清空全部消息与会话、置顶消息列表查询已接入。 | 聊天室单会话未读清零按 SDK 5.0 不支持处理，不调用。清空全部消息与会话为危险操作，页面保留确认框，但成功状态只以 SDK resolve 为准。 |
| 消息回执 | `ChatManager.sendMessageReadReceipts`, `getGroupMessageReadUsers`, `getGroupMessageReadReceipts` | 是 | 单聊 / 群聊已读回执发送已接入；群消息右键支持查询已读用户列表和回执详情；聊天室回执不调用。 | 群消息已读详情真实失败以 SDK / 服务端返回为准，不本地补齐。 |
| 历史、搜索、删除、撤回、编辑、合并解析 | `ChatManager.getHistoryMessages`, `searchMessages`, `removeHistoryMessages`, `recallMessage`, `modifyMessage`, `downloadAndParseCombineMessage` | 是 | 历史消息、服务端消息搜索、删除消息、撤回消息、文本编辑、合并消息详情解析均已有页面入口。 | 真实成功 / 失败以服务端响应为准；静态覆盖不代表每种会话类型都已真实 PASS。 |
| 消息置顶 | `ChatManager.pinMessage`, `unpinMessage`, `getPinnedMessageList` | 是 | 消息列表项右键菜单已覆盖置顶和取消置顶；消息页头部已提供当前会话置顶消息列表抽屉，调用 `getPinnedMessageList({ conversationId, conversationType })` 并展示 SDK 返回的 `items`。 | SDK 返回空列表、缺少操作者等字段时按真实结果展示。 |
| 附件下载 | `ChatManager.downloadAttachment` | 是 | 图片 / 视频 / 文件 / 语音消息右键支持调用 `downloadAttachment({ message })`，展示 SDK 返回的 `filename`、`mimeType`、`size`、`downloadUrl`、二进制长度，并提供基于 SDK 返回二进制的下载链接。 | 失败保留 SDK / 服务端真实错误，不退回浏览器直链作为成功。 |
| Reaction | `ChatManager.addReaction`, `removeReaction`, `getReactionList`, `getReactionDetail` | 是 | 单聊 / 群聊 Reaction 添加、取消、列表、详情均已接入。 | 聊天室 Reaction 是否支持不在当前功能清单中。 |
| 翻译和语音转文字 | `ChatManager.getSupportedTranslationLanguages`, `translateMessage`, `voiceMessageToText`, `voiceFileToText` | 是 | 文本消息右键菜单已读取 SDK 5.0 支持语言列表，并调用 `translateMessage({ message, targetLanguages })` 展示真实翻译结果；语音消息右键菜单已调用 `voiceMessageToText(message.body)` 展示真实转写结果；个人设置将用户选择的浏览器原始 `File` 与可选 `VoiceParams` 直接传给 `voiceFileToText(file, voiceParams)`。 | 文件格式、时长、服务开通状态和转写结果均以 SDK / 服务端真实返回为准，不使用本地转写或伪结果。 |
| 联系人列表和好友关系 | `ContactManager.getContacts`, `addContact`, `deleteContact`, `acceptContactInvite`, `declineContactInvite`, `setContactRemark`, `getBlocklist`, `addUsersToBlocklist`, `removeUserFromBlocklist` | 是 | 好友列表、添加好友、删除好友、同意 / 拒绝好友申请、好友备注、单聊黑名单列表、加入 / 移出黑名单均已接入。 | 黑名单成功必须以 SDK 返回的 `succeeded` 目标用户为准；不本地伪造成功。 |
| 联系人事件监听 | `ContactManager.addEventHandler`, `removeEventHandler` | 是 | 已监听 SDK 5.0 好友申请、好友添加、好友删除等命名联系人事件；注册前调用同 ID `removeEventHandler` 清理旧监听。 | 真实事件下发以 SDK / 服务端回调为准；不从联系人快照补造事件。 |
| 在线状态 | `PresenceManager.addEventHandler`, `publishPresence`, `subscribePresence`, `unsubscribePresence`, `getSubscribedPresenceList`, `getPresenceStatus`, `removeEventHandler` | 是 | 发布在线状态、订阅 / 取消订阅好友在线状态、查询订阅列表、查询在线状态、监听 Presence 变更和移除监听均已接入；注册前调用同 ID `removeEventHandler` 清理旧监听。 | 真实 Presence 事件和查询结果以 SDK / 服务端返回为准。 |
| 会话推送与免打扰 | `PushManager.setConversationSilentMode`, `getConversationSilentMode`, `clearConversationRemindType` | 是 | 单个会话推送通知方式、免打扰时长、清除提醒方式已接入。 | 仅按 SDK 5.0 支持的单聊 / 群聊处理；聊天室免打扰当前 SDK 无公开能力。 |
| 推送扩展能力 | `PushManager.uploadPushToken`, `setGlobalSilentMode`, `getGlobalSilentMode`, `getConversationSilentModes`, `setPushLanguage`, `getPushLanguage`, `getConversationListByRemindType` | 是 | 个人设置页提供上传 Push Token、设置 / 查询全局免打扰、批量查询会话免打扰、设置 / 查询推送语言、按提醒类型分页查询会话入口，均调用 SDK 5.0 `PushManager` 公开 API 并展示真实返回 / 错误。 | Push Token 由用户输入，不生成假 token；聊天室不传入批量会话免打扰查询。 |
| 用户资料基础能力 | `UserInfoManager.getUserInfoByUserId`, `updateOwnInfo` | 是 | 登录用户资料、联系人资料、编辑当前用户资料已接入。 | 无。 |
| 用户资料扩展能力 | `UserInfoManager.addEventHandler`, `removeEventHandler`, `getUserInfoByAttribute`, `subscribeUsersInfo`, `unsubscribeUsersInfo`, `getSubscribedUsers`, `updateOwnInfoByAttribute` | 是 | 个人设置页注册并移除用户资料事件监听；提供按 SDK 5.0 `UserInfoAttribute` 属性查询资料、订阅 / 取消订阅用户资料变更、查询已订阅用户、按单属性更新当前用户资料入口，并展示 SDK 真实返回与事件日志。 | 真实订阅通知、字段返回和服务端错误以 SDK / 服务端结果为准；不做本地回填或旧字段映射。 |
| 群组创建、加入、邀请和申请处理 | `GroupManager.createGroup`, `joinGroup`, `inviteUsersToGroup`, `acceptGroupJoinRequest`, `rejectGroupJoinRequest`, `acceptInvitation`, `rejectInvitation` | 是 | 创建群组、申请入群、邀请入群、同意 / 拒绝入群申请、同意 / 拒绝群邀请均已接入。 | 邀请列表过滤和真实失败展示依赖当前页面实现；SDK 失败不兜底。 |
| 群组事件监听 | `GroupManager.addEventHandler`, `removeEventHandler` | 是 | 已监听 SDK 5.0 命名群组事件并刷新系统通知、群成员、群详情、公告、共享文件等；注册前调用同 ID `removeEventHandler` 清理旧监听。 | 真实群组事件下发以 SDK / 服务端回调为准；通知层只承载 SDK 5.0 原始事件名和 payload，不退回 V4 事件模型。 |
| 群组列表与详情 | `GroupManager.getJoinedGroupList`, `getGroup`, `Group.getSummary`, `Group.getDetail`, `Group.refresh` | 是 | 已加入群快照、单群实体、群轻量摘要、会话列表和创建后群详情均已使用公开 `GroupManager.getJoinedGroupList`、`getGroup`、`Group.getSummary`、`Group.getDetail`；登录后立即读取一次本地快照，并在 SDK 5.0 `ChatClient.onSyncDataFinished({ dataType: 'group', status: 'success' })` 后刷新快照；资料更新后调用 `Group.refresh()` 并直接展示返回的 `GroupDetail`。 | `getJoinedGroupList()` 是本地同步快照读取，不主动发起服务端请求；同步失败保留真实 payload/error，不用 REST 兜底或伪造群组。`Group.getSummary()` 是本地轻量摘要读取，可能按 SDK 真实结果返回 `null`；不通过 `getDetail` 本地伪造摘要。 |
| 群组基础资料、配置和所有权 | `Group.updateInfo`, `updateConfigs`, `changeOwner` | 是 | 修改群名称、描述、头像、扩展信息已通过公开 `groupManager.getGroup(groupId).updateInfo()` 接入；群管理页提供群配置与群主入口，调用 `Group.updateConfigs({ public, joinApprovalRequired, allowInvites, inviteNeedConfirm, maxMembers })` 更新配置，调用 `Group.changeOwner({ newOwner })` 转让群主，成功后调用 `refresh()` 并展示 SDK 真实 `GroupDetail`。 | 真实权限、配置限制和转让结果以 SDK / 服务端返回为准；失败不本地回填。 |
| 群组退群与解散 | `Group.leave`, `Group.destroy` | 是 | 退群和解散群组均通过公开 `groupManager.getGroup(groupId).leave()` / `destroy()` 接入。 | 静态覆盖不等于真实服务端 PASS；失败仍按 SDK / 服务端真实错误展示。 |
| 群成员与管理员 | `Group.getMembers`, `removeMembers`, `getAdmins`, `addAdmin`, `removeAdmin` | 是 | 群成员列表、群组定向消息成员来源和移出成员已使用公开 `Group.getMembers` / `removeMembers`；群管理页提供管理员入口，调用 `Group.getAdmins()` 展示 `GroupUserInfo[]`，调用 `Group.addAdmin({ userId })` 和 `Group.removeAdmin({ userId })` 操作管理员，成功后重新查询管理员和成员列表。 | 真实权限和服务端结果以 SDK 返回为准；失败不本地回填。 |
| 群禁言 | `Group.getMuteList`, `muteMembers`, `unmuteMembers`, `muteAllMembers`, `unmuteAllMembers`, `checkIfInMuteList` | 是 | 查看禁言、禁言成员、解除禁言、群全员禁言、解除群全员禁言和查询当前用户禁言状态均已通过公开 `Group` facade 接入。 | 真实权限和服务端结果以 SDK 返回为准；失败不本地回填。 |
| 群黑名单 | `Group.getBlocklist`, `blockMembers`, `unblockMembers` | 是 | 查看群黑名单、添加群成员到黑名单、移出群黑名单均已通过公开 `Group.getBlocklist` / `blockMembers` / `unblockMembers` 接入。 | 真实成功 / 失败以 SDK / 服务端返回为准，不本地补齐。 |
| 群白名单 | `Group.getAllowlist`, `addUsersToAllowlist`, `removeUsersFromAllowlist`, `checkIfInAllowList` | 是 | 群管理页提供白名单入口，调用 `Group.getAllowlist()` 展示 `entry.user.userId`，调用 `addUsersToAllowlist({ userIds })` 和 `removeUsersFromAllowlist({ userIds })` 操作成员，并调用 `checkIfInAllowList()` 展示当前用户真实白名单状态。 | 真实权限和服务端结果以 SDK 返回为准；失败不本地回填。 |
| 群公告 | `Group.getAnnouncement`, `updateAnnouncement` | 是 | 获取和修改群公告已通过公开 `Group.getAnnouncement` / `updateAnnouncement` 接入。 | 真实成功 / 失败以 SDK / 服务端返回为准。 |
| 群共享文件 | `Group.getSharedFileList`, `uploadSharedFile`, `deleteSharedFile`, `downloadSharedFile` | 是 | 查看、上传、删除、下载群共享文件已通过公开 `Group.getSharedFileList` / `uploadSharedFile` / `deleteSharedFile` / `downloadSharedFile` 接入。 | 真实成功 / 失败以 SDK / 服务端返回为准。 |
| 群成员属性 / 群名片 | `Group.setMemberAttributes`, `getMembersAttributes` | 是 | 群成员管理页调用 `Group.setMemberAttributes({ userId, memberAttributes: { groupNamecard } })` 设置群名片，并调用 `Group.getMembersAttributes({ userIds, keys: ['groupNamecard'] })` 查询；页面展示 SDK 返回的 `items` 与每个成员原始属性 JSON。 | 真实权限、属性长度、服务开通状态以 SDK / 服务端返回为准；失败不本地回填。 |
| 聊天室列表、加入和事件 | `ChatRoomManager.getChatRoomList`, `joinChatRoom`, `addEventHandler`, `removeEventHandler`, `getChatRoom` | 是 | 聊天室列表、加入聊天室、聊天室事件监听和移除监听、单聊天室实体对象获取均已接入。 | 静态覆盖不等于真实服务端 PASS；失败仍按 SDK / 服务端真实错误展示。 |
| 聊天室基础资料 | `ChatRoom.getInfo`, `refresh`, `updateInfo`, `leaveChatRoom` | 是 | 聊天室详情、刷新聊天室详情、修改聊天室信息、退出聊天室均已通过公开 `ChatRoom.getInfo` / `refresh` / `updateInfo` / `leaveChatRoom` 接入。 | 真实权限和服务端结果以 SDK 返回为准；失败不本地回填。 |
| 聊天室成员与管理员 | `ChatRoom.getMembers`, `removeMembers`, `getAdminList`, `addAdmin`, `removeAdmin` | 是 | 成员列表、移出成员、管理员列表、添加管理员、移除管理员均已通过公开 `ChatRoom` facade 接入。 | 真实成功 / 失败以 SDK / 服务端返回为准。 |
| 聊天室禁言 | `ChatRoom.getMuteList`, `muteMembers`, `unmuteMembers`, `muteAllMembers`, `unmuteAllMembers`, `checkIfInMuteList` | 是 | 禁言列表、禁言、解除禁言、全员禁言、取消全员禁言、查询当前用户禁言状态均已通过公开 `ChatRoom` facade 接入。 | 真实成功 / 失败以 SDK / 服务端返回为准。 |
| 聊天室黑名单 | `ChatRoom.getBlocklist`, `blockMembers`, `unblockMembers` | 是 | 黑名单列表、添加黑名单、移出黑名单均已通过公开 `ChatRoom` facade 接入。 | 真实成功 / 失败以 SDK / 服务端返回为准。 |
| 聊天室白名单 | `ChatRoom.getAllowlist`, `addUsersToAllowlist`, `removeUsersFromAllowlist`, `checkIfInAllowList` | 是 | 白名单列表、添加白名单、移出白名单、查询当前用户白名单状态均已通过公开 `ChatRoom` facade 接入。 | 真实成功 / 失败以 SDK / 服务端返回为准。 |
| 聊天室公告 | `ChatRoom.getAnnouncement`, `updateAnnouncement` | 是 | 聊天室公告展示和更新均已通过公开 `ChatRoom` facade 接入。 | 真实成功 / 失败以 SDK / 服务端返回为准。 |
| 聊天室自定义属性 | `ChatRoom.getAttributes`, `setAttributes`, `removeAttributes` | 是 | 获取属性、设置单个 / 批量属性、删除单个 / 批量属性均已通过公开 `ChatRoom` facade 接入。 | 真实成功 / 失败以 SDK / 服务端返回为准。 |
| 消息话题 Manager 能力 | `ChatThreadManager.addEventHandler`, `removeEventHandler`, `getChatThread`, `createChatThread`, `getChatThreadList`, `getJoinedChatThreadList`, `getChatThreadLastMessageList`, `getChatThreadInfo`, `joinChatThread`, `leaveChatThread`, `destroyChatThread`, `updateChatThreadName`, `getChatThreadMemberList`, `removeChatThreadMember` | 部分覆盖 | 创建话题、查询父群话题列表、查询我加入的话题、批量最后一条消息、`getChatThread(chatThreadId)` 实体入口、话题事件监听与移除监听均已接入。 | Manager 单话题直调公开 API 未作为页面入口覆盖；同等用户功能已通过 SDK 5.0 `ChatThread` facade 覆盖，避免保留双路径。 |
| 消息话题实体 API | `ChatThread.getInfo`, `refresh`, `join`, `leave`, `destroy`, `updateName`, `getMemberList`, `removeMember` | 是 | 群组子区抽屉中，单个消息话题的详情、refresh 刷新、加入、退出、解散、改名、成员列表和移出成员均先调用 `chatThreadManager.getChatThread(chatThreadId)` 获取实体，再调用实体方法；所有结果按 SDK / 服务端真实响应展示。 | 静态覆盖不等于真实服务端 PASS；仍需用真实群组子区逐项执行并保留 Console 请求 / 回调证据。 |

## API 级缺口摘要

- 当前静态统计：公开对外 API 共 `205` 个，已覆盖 `193` 个，仍有 `12` 个未覆盖；`@internal` 私有入口已剔除，不计入分母或缺口。
- 消息：附件下载、群消息已读用户 / 回执详情、置顶消息列表、全会话未读清零、清空全部消息与会话、当前会话上下文、主动刷新会话列表、消息事件监听移除以及本地语音文件转写均已补齐；个人设置将浏览器原始 `File` 与用户明确输入的可选 `VoiceParams.format` 直接传给 `ChatManager.voiceFileToText(file, voiceParams)`，不本地转写、不伪造结果。
- ChatClient：连接状态查询、REST 上下文、Token 续期、缓存管理、上传适配器、联系人快照、事件移除、RTC UID 反查及其他平台登录 ID 查询均已覆盖；仍未覆盖动态 `ChatClient.use` 注册（`1` 个）。
- 平台适配：仍未覆盖 `createPlatformAdapter`、`detectRuntimePlatform`（`2` 个）；当前 Demo 使用 SDK 默认浏览器平台适配，未提供自定义适配入口。
- 推送：上传 Push Token、全局免打扰、批量会话免打扰、推送语言、按提醒类型分页查询会话已覆盖；真实通过 / 失败仍以页面 SDK 调用为准。
- 用户资料：基础资料查询 / 整体更新和扩展能力均已覆盖；个人设置页调用 `UserInfoManager` 公开 API 展示真实返回、事件日志和错误。
- 群组：公开 `Group` facade 已覆盖本地轻量摘要、详情、`refresh`、资料修改、配置更新、群主转让、退群、解散、成员、管理员、黑名单、白名单、禁言、公告、共享文件和群成员属性 / 群名片；`Group.getSummary()` 按 SDK 真实结果展示 `JoinedGroupSummary | null`，不通过 `getDetail` 本地伪造摘要。`GroupManager.getGroupInfo`、`getGroupInfoList` 是公开直调 API，当前为维持 facade 单路径未调用，因此计为 `2` 个静态缺口；所有 `@internal` Manager 转发入口不在分母或缺口中。
- 聊天室：公开 `ChatRoom` facade 管理能力已覆盖基础资料、刷新、成员、管理员、黑名单、白名单、禁言、公告和自定义属性；真实服务端结果仍以页面 SDK 调用为准。
- 消息话题：创建、列表、我加入的列表、批量最后消息和事件生命周期由 `ChatThreadManager` 覆盖；单个话题详情、refresh、加入、退出、解散、改名、成员列表和移出成员已按 SDK 5.0 `ChatThread` facade 覆盖。为避免同一能力保留 Manager / facade 双路径，以下 Manager 单话题直调 API 未单独提供页面入口：`getChatThreadInfo`、`joinChatThread`、`leaveChatThread`、`destroyChatThread`、`updateChatThreadName`、`getChatThreadMemberList`、`removeChatThreadMember`（`7` 个）。
- 缺口合计：`1`（ChatClient 动态注册）+ `2`（平台适配）+ `2`（群组 Manager 直调）+ `7`（消息话题 Manager 直调）= `12`。前 `3` 个不新增页面入口，避免为固定浏览器运行环境或固定 Manager 初始化引入第二路径；后 `9` 个已有等价 `Group` / `ChatThread` facade 用户能力，属于为保持 SDK 5.0 单路径而保留的静态 API 缺口。
- 本摘要仅说明静态 `src/` 调用覆盖。已覆盖 API 是否真实可用，仍必须以页面请求、SDK 回调和服务端响应验收。
