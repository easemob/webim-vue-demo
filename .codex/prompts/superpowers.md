# Superpowers for SDK 5.0 Demo and Playwright Automation

# 企业级 UI 自动化编码规范（Codex 必须严格遵守）

## 1. 核心原则

- 只使用 Playwright 做 WebUI 自动化
- 必须使用 PO 模式（页面对象模型）
- 禁止使用 time.sleep()
- 必须自动等待、自动断言
- 代码必须稳定、可重复执行、无随机失败
- 当前仓库是“服务端能力验证用 Web demo”，默认禁止新增客户端兜底逻辑
- 不允许通过自动重试、模拟成功、静默降级、吞错续跑来掩盖 SDK 或服务端真实结果
- Demo 运行时代码只能调用 SDK 5.0 的公开 `ChatClient` 与 Manager API；禁止恢复 v4 API、私有 SDK 子路径、REST 替代或本地兼容模拟
- 当前分支必须零保留 SDK 4.0 代码及兼容代码：禁止保留或新增 V4 参数/事件/消息字段转换器、聚合事件适配器、双路径、旧字段别名或 SDK 4.0 发送入口；迁移必须删除旧路径并让 UI、Store、日志直接消费 SDK 5.0 公开模型
- SDK 5.0 运行时消息展示必须直接判断 `Message.type` 的 `text/image/voice/location/file/video/custom/cmd/combine`；服务端搜索 `SearchMessages.option.msgTypes` 必须原样传入其独立的 SDK 5.0 `SearchableMessageType` 值 `txt/img/video/file/loc/custom/combine`，两者不得通过 V4 常量或本地转换互相映射
- 聊天室路由、日志和 Store 只使用 `chatRoomId`；`ChatRoomMemberEntry`、黑名单、白名单和禁言名单均直接保留 SDK 5.0 原始 entry，成员 ID 只从 `entry.user.userId` 读取，管理员 `UserInfo[]` 只从 `admin.userId` 读取
- 消息话题列表、成员列表、最后消息批量结果必须直接读取 SDK 5.0 返回的 `items/cursor`，不重封装为本地 `list`，不以空数组或空 cursor 补造缺失字段
- SDK 5.0 合并消息接收端只展示 `CombineMessageBody.title`、`summary`、可选 `messageList` 的真实下行字段；`messageList` 缺失时明确显示未下发，禁止按发送端本地源消息或固定 `0` 补齐
- 群组黑名单必须通过 SDK 5.0 公开 `groupManager.getGroup(groupId).getBlocklist()` 获取，并仅用每项 `user.userId` 展示、判断与操作；禁止把条目对象转字符串展示或用于成员 ID 比较

## 2. 编码规范

- TypeScript + Playwright
- 严格规范
- 函数、类必须加注释说明
- 元素定位统一放在 page 类
- 用例只写业务逻辑，不写元素定位
- 用例必须加断言
- 失败自动截图

## 3. 项目结构（强制）

tests/
  pages/          # 页面对象
  fixtures/       # 前置夹具
  specs/          # 测试用例
  support/        # 工具
playwright.config.ts
package.json

## 4. Playwright 规范（必须遵守）

- 使用 page.get_by_role()
- 使用 page.get_by_text()
- 使用 page.get_by_placeholder()
- 尽量不使用 CSS/XPath
- 必须使用 expect 断言
- 必须等待元素可见/可点击
- 用例之间相互独立
- 支持多浏览器运行

---

### ✅【你要的规则在这里！！！】

- 全局 **只启动 1 次浏览器**，所有用例共享浏览器实例
- 每个 test 用例 = 独立 BrowserContext，只新建页面，**不重启浏览器**
- ❌ 绝对禁止：在 .spec.ts 用例里写 browser.launch()

---

## 5. 用例规范

- 一个用例一个场景
- 前置条件在 fixture
- 用例必须加断言
- 自动截图、自动录屏（可选）
- 自动化测试可通过服务端 API 创建用户、群组或聊天室作为前置数据；这仅用于测试环境准备，不能成为 Demo 页面功能的实现或 SDK 5.0 能力兜底
- 测试数据配置必须从文件读取，不允许把 `base_url`、`client_id`、`client_secret`、`org_name`、`app_name` 硬编码在用例中
- 测试数据创建结果必须回传到 fixture / page object / spec，供 UI 用例直接消费
- 若具备清理能力，测试结束后清理动态创建的用户与聊天室；若暂未实现自动清理，必须输出资源标识用于回收

## 6. 禁止行为

- 禁止 time.sleep()
- 禁止强制等待
- 禁止写死数据
- 禁止用例依赖
- 禁止混乱定位
- 禁止继续依赖人工预置聊天室或人工预置用户名作为聊天室主流程的唯一数据来源

## 7. 业务场景（环信 WebDemo）

覆盖：

- 通过接口动态创建测试用户
- 通过接口动态创建聊天室
- 登录
- 进入聊天室列表
- 刷新列表
- 加入/进入聊天室
- 发送消息-文本消息、图片消息（本地文件调用 SDK 5.0 `createImageMessage` 时必须传顶层 `data`，并传递 `filename`、`filetype`、`width`、`height`；展示严格使用 `ImageMessageBody.thumbnailUrl`，预览严格使用 `originalImageUrl`）、文件消息（本地文件调用 SDK 5.0 `createFileMessage` 时必须传顶层 `data`、`filename`、`filetype`、`fileSize`；展示大小严格使用 `FileMessageBody.fileLength`）、语音消息（浏览器从实际文件读取 `duration`，并以 SDK 5.0 `createVoiceMessage` 的顶层 `data`、`duration` 发送；缺少有效时长时保留失败）、视频消息（浏览器从实际文件读取 `duration`、`videoWidth`、`videoHeight`，并以 SDK 5.0 `createVideoMessage` 的顶层 `data`、`duration`、`width`、`height` 发送；缺少有效时长时保留失败）、自定义消息（SDK 5.0 `createCustomMessage` 的业务 JSON 必须传入 `params`，接收端只从 `body.params` 展示；顶层 `ext` 仅为消息扩展，不作本地合并或补值）、透传消息、位置消息
- 禁言/解禁 - 管理员、普通成员
- 成员管理 - 加入、退出、禁言、解禁、设置管理员、黑名单、白名单
- 公告管理-修改公告、删除公告
- 聊天室创建/解散与消息举报：当前 SDK 5.0 未公开 API；Demo 不提供创建聊天室入口，页面不得使用 REST、旧 SDK 或本地模拟替代。详见 [`docs/sdk5-unsupported-capabilities.md`](../../docs/sdk5-unsupported-capabilities.md)。
- SDK 5.0 已公开但当前 Demo 尚未覆盖的能力，必须登记到 [`docs/sdk5-uncovered-capabilities.md`](../../docs/sdk5-uncovered-capabilities.md)；实现后从该记录移除，并同步写入功能清单。
- 事件监听与回调校验

---

## 8. 当前功能基线

本仓库当前已实现的用户可见能力，统一以 [`cases_list.md`](/Users/admin/easemob/easemob-web/demo/demo/webim_vue_demo/cases_list.md) 为准。现阶段主要覆盖：

- 消息菜单的“删除漫游消息”只适用于带真实 `msgServerId` 的 SDK 5.0 单聊/群聊消息，必须调用 `ChatManager.removeHistoryMessages({ conversationId, conversationType, messageIds: [msgServerId] })`；不得把 `msgLocalId`、聊天室或 `/notify` 作为替代路径。仅在 SDK resolve 后删除当前消息行；reject 时保留消息与请求参数、原始 error，不重试、不伪造成功。`ChatManager.onMultiDeviceMessageRemoved` 只记录 SDK 实际下发的原始事件及 `conversationId`、`conversationType`、`messageIds`、`beforeTimestamp`、`deviceId`，并按原始单聊/群聊类型进入事件中心；同设备回显未下发时不补造事件。
- 当前会话顶部“更多操作”的按时间删除漫游消息仅对非话题单聊/群聊展示；日期控件只允许选择到分钟，用户二次确认后使用该分钟起点的 `beforeTimestamp` 调用 `ChatManager.removeHistoryMessages({ conversationId, conversationType, beforeTimestamp })`。不得传 `messageIds`、调用 REST notify 接口或按本地 `timestamp` 过滤。SDK resolve 后清空该会话缓存并从首游标真实 `getHistoryMessages` 重拉；SDK delete/reload reject 或失败都必须输出原始参数和 error，且不得显示删除成功或自动重试；聊天室不展示该入口。
- `onMultiDeviceMessageRemoved` 若 SDK 实际下发 `chatRoom`，事件中心按聊天室分类；`conversationType` 缺失或未知时必须保留原始 event 和 warning，并以“连接事件”承载该未分类记录，禁止猜成单聊或群聊。
- Web demo 以真实暴露服务端与 SDK 行为为前提，不提供客户端伪成功兜底。
- IM 能力唯一依赖本地 `easemob-websdk 5.0`；初始化使用 `ChatClient` 与领域 Manager，禁止恢复 SDK 4.0 客户端实例、私有子路径或兼容层。
- 任意 WebSDK 5.0 调用前，必须以当前安装包的公开 TypeScript 类型声明和方法签名逐项核对参数名、必填项、类型和返回字段；不得传递旧 SDK 字段、同义映射或兼容参数。发现不一致时，先通过定向回归测试覆盖完整公开契约，再仅修改 Demo 调用层；不得修改 SDK tgz、SDK 源码或以本地默认值伪造服务端成功。
- 服务端失败提示需与真实错误语义一致，同一次失败仅保留一条完整错误日志用于排查。
- 控制台会完整输出 SDK 5.0 调用、响应、事件、失败与重连日志，并用前缀区分 SDK 原始日志、App 事件派发、Store/UI 外层处理日志，便于排查 socket、消息和聊天室链路。
- 历史消息只能以 SDK 5.0 `ChatManager.getHistoryMessages(options)` 调用；Demo 必须分别输出 `[Demo -> SDK 5.0 API]` 的真实请求参数和 `[Demo <- SDK 5.0 API]` 的原始 `HistoryMessagesResult` / 错误，且不得把这些边界日志伪称为 SDK 内部日志。成功响应必须先按原始 `items` 写入当前 `conversationId` 的 Store，再结束历史加载并返回页面；成功日志须同时输出 SDK 返回数与 Store 入库数/消息 ID。SDK 内部日志由 `setLogLevel('debug')` 开启，并以 `[Chat]` 前缀识别。
- SDK 5.0 个人设置不提供“下载 SDK 缓存日志”或“立即上报日志”入口。日志开关只调用公开 `setLogLevel('error'/'debug')` 控制浏览器 Console 输出；SDK 内部日志是否自动上报仅由登录时 DNS 的 `enableReportLogs` 决定，Demo 不调用私有 API、REST 或本地下载兜底。
- SDK 5.0 登录只接受环信 ID 与 Token。NGI 与线上 VIP6 必须使用 SDK DNS 获取与 AppKey 匹配的真实 REST/WS 地址；仅在 TKE/DEV/QA隔舱等用户明确选择的私有化环境传 `serviceConfig.serverUrls` 固定地址，禁止为“可用”而把 Token 强制发送到历史默认集群。私有化服务器配置窗口必须直接提供 SDK 5.0 原始 `syncWsUrl` 的可编辑项；固定环境加载已保存配置时，必须先应用当前环境预设，并把用户保存的值原样传入 `serverUrls.syncWsUrl`。TKE 默认预填 `wss://tke-sdb-fusion.easemob.com/ws`。地址缺失时保留 SDK 同步失败，不改走 REST、DNS 或本地伪造数据。
- 不得在 SDK 5.0 `onConnected` 事件中调用依赖会话 REST 上下文的 Manager。联系人、资料、在线状态、群组与会话初始化只能在 `await client.login()` 成功后执行，并通过公开 `client.getCurrentUserId()` 获取当前用户；禁止读取 v4 风格的实例字段。登录成功后使用 SPA 路由，不刷新页面并触发第二次登录。手动 Token 登录和缓存态重新登录的 Provision 拒绝都必须输出脱敏的 AppKey、服务模式、SDK 5.0 公开 `getServerUrlsConfig()` 返回的固定地址、用户 ID、Token 长度及 SDK 原始 `statusCode/reason`，不得打印 Token 明文、重试或伪造成功。
- 群组列表必须按 SDK 5.0 同步模型展示：`GroupManager.getJoinedGroupList()` 只读取本地同步快照，不是主动服务端拉取；登录初始化可立即读取一次快照，同时必须监听 `ChatClient.onSyncDataFinished`，仅在 `{ dataType: 'group', status: 'success' }` 后重新读取并展示快照。同步失败时保留真实 payload/error，不调用 REST 兜底、不本地伪造群组。
- ChatClient 诊断能力必须只调用 SDK 5.0 公开 `getConnectionState()`、`getRestContext()`、`renewToken(token)`、`getCacheManager()`、`getUploadAdapter()`、`getContactSnapshot()`；REST 上下文和续期结果涉及 token 时只能展示脱敏摘要，不输出 token 明文，不改写 SDK 真实错误。ContactManager、PresenceManager、GroupManager 和 ChatClient 事件监听注册前必须先调用同一 handlerId 的 `removeEventHandler(handlerId)`，再调用 `addEventHandler(handlerId, handlers)`，禁止保留重复监听、旧聚合事件或旧字段路径。
- SDK 消息解析空引用异常会保留原始错误日志并阻止开发态全屏错误覆盖层，不包装成成功结果。
- IM 连接断开、发送超时等真实失败仅打印到控制台，不使用开发态全屏错误覆盖层遮挡页面。
- UI 离线提示严格跟随 SDK 5.0 连接事件：`onConnecting` 显示离线，收到真实 `onConnected` 后恢复在线；不得因先前连接过程遗留离线提示而掩盖已成功建立的连接。
- socketUrl 显式配置 `ws://` 或 `wss://` 时原样使用，未配置协议时默认补 `wss://`。
- 已读回执展示时机（覆盖本文所有相反的历史表述）：接收方点击单聊或群聊会话时，调用 `clearConversationUnreadMessageCount({ conversationId, conversationType })`；页面消息完成渲染后，仅对 SDK 5.0 原始 `direct: 'RECEIVE'`、`needReadReceipt: true`、带 `msgServerId` 的单聊或群聊消息调用 `sendMessageReadReceipts({ conversationId, conversationType, messageIds })`。`needReadReceipt` 是 SDK 5.0 的真实前置条件；不得额外以 `getCurrentConversation()`、`document.visibilityState` 或 `skipped` 分支阻止调用。聊天室不调用已读回执 API；调用的请求、响应或失败必须保留 SDK 5.0 边界日志。
- 已读回执候选选择（覆盖上一条“以 readAt 排除历史消息”的表述）：接收方点击单聊或群聊时，继续按原流程保存 SDK 5.0 `ConversationItem.readAt` 和 `unreadCount` 后清零未读数；手动“清空未读”流程不变。页面实际渲染的每条真实 `direct: 'RECEIVE'`、`needReadReceipt: true`、带 `msgServerId` 的单聊或群聊消息均是回执候选，不能因菜单清未读已推进 `readAt` 而被排除。`readAt`、`unreadCount` 仅记录为 SDK 调用上下文，绝不截取或猜测消息 ID；每个消息页生命周期只处理新渲染消息。聊天室不调用。
- 离线消息 Read ACK 真实验证：仅监听 SDK 5.0 `ChatClient.onOfflineMessageSyncStart`、`onOfflineMessageSyncFinish`；两者无 payload 时在事件中心“连接事件”明确显示 SDK 未下发 payload。接收消息的 `isOnline` 直接输出到 Console，只有 `isOnline === false` 才在消息行标注“SDK 离线同步消息”，字段缺失或 `true` 不推断离线。消息页面实际渲染后的离线单聊/群聊仍走同一 `sendMessageReadReceipts` 请求、响应或失败边界；发送方只能收到真实 `onMessageReadReceipts` 才显示 `✓✓`。聊天室不调用；SDK 未下发事件、字段或回调时不伪造离线标签、事件或 Read ACK 成功。
- 只投在线用户发送必须使用 SDK 5.0 Message 字段：开关只在单聊 / 群聊展示，开启时在 `createMessage(...)` 入参中写入 boolean `deliverOnlineOnly: true`，不得传字符串 `"true"`，不得放到 `sendMessage(message, options)` 第二参，也不得使用旧字段、兼容映射或本地兜底伪造成只投在线成功。
- 系统设置黑名单列表刷新必须保留真实 SDK 5.0 结果：打开系统设置或点击刷新时调用 `ContactManager.getBlocklist()`，若返回 403 / Forbidden 等真实失败，只能 console 输出原始 error 并 toast 提示，不能触发开发态红屏，不能把失败伪造成空黑名单成功。
- SDK 5.0 消息和历史消息以 `msgServerId`、`msgLocalId`、`conversationId`、`conversationType`、`sender`、`timestamp`、`type`、`body`、`ext` 为唯一真实契约；UI、Store 与日志直接消费这些字段，禁止映射至 SDK 4.0 旧字段或其他 V4 展示模型。本地会话搜索与最后消息预览仅从 SDK 5.0 `lastMessage.body`、`lastMessage.timestamp` 和 `lastMessage.type` 读取内容；消息扩展资料处理只从 `message.sender.userId`、`message.timestamp` 与 `message.ext` 读取数据，并把原始 Message 与上述 SDK 5.0 字段输出到控制台；字段缺失时不本地补值。所有打开消息页的路由仅传入 `conversationId`、`conversationType`；消息页不读取、转换或兼容旧路由字段。进入消息页必须调用 SDK 5.0 `setCurrentConversation({ conversationId, conversationType })`，展示 `getCurrentConversation()` 真实返回，切换或离开消息页必须调用 `resetCurrentConversation()`；该能力用于验证 SDK 当前会话收到在线消息时不累加本地未读，禁止用本地 Store 状态伪造 SDK 当前会话结果。历史查询和会话未读清零的调用者必须显式传入 `conversationId`、`conversationType`，不得透传旧路由对象或旧字段。定向消息组件、成员查询和发送请求同样只可使用这两个会话字段与 `receiverList`。服务端实际缺字段时清晰报错，不本地推断会话类型。`groupChat` 与 `chatRoom` 定向消息的接收人必须在创建消息时以 `receiverList` 传入；禁止把它放在 `sendMessage` options 后仍把广播结果显示为定向成功。跨端编辑和撤回仅按事件的 `messageId/conversationId/conversationType` 定位；SDK 未下发完整定位字段时保留真实事件和错误，不用 V4 本地字段补齐。
- 使用环信 ID 与 Token 的 SDK 5.0 登录、NGI/线上 VIP6/TKE/DEV/QA隔舱服务配置、主导航显示当前运行环境、会话管理、单个会话推送通知方式与免打扰时长、联系人详情与好友关系维护。发起好友申请必须使用 SDK 5.0 `contactManager.addContact({ userId, message })`；接收端仅由真实 `onContactInvited` 回调创建好友申请通知，SDK/服务端未下发时不轮询联系人列表或补造通知。好友关系建立时，SDK 5.0 `onContactAdded` / `onContactAgreed` 已更新联系人快照，Demo 必须从 `contactManager.getContacts()` 刷新展示，禁止从旧事件 `from` 字段猜测好友 ID 或改写 SDK 回调字段。在线状态订阅仅将 SDK 5.0 联系人快照的真实、非空、非当前登录用户 `userId` 作为 `subscribePresence({ userIds })` 参数。消息页头部 Presence 自动订阅只能在 `conversationType === CONVERSATION_TYPE.SINGLE` 时调用 `subscribePresence({ userIds })`；禁止用“非群聊”判断覆盖聊天室；`subFriendsPresence` 必须过滤空 ID 和当前登录用户，失败日志必须保留 currentUser、validUserIds、requestBatches 和原始 error。Presence 订阅列表查询必须传服务端接受的 `pageNum: 1` 并在 Demo 调用边界把 `pageNum/pageSize` 规范为正整数；若 SDK 类型注释仍称 0 起始，与服务端 400 冲突时保留原始错误，不重试、不伪造结果；页面必须 catch 真实错误并用 toast/console 展示，不能触发开发态红屏。会话列表不得暴露“刷新会话列表”入口；`refreshSessionList` 属于内部接口，不调用、不展示、不计入公开功能覆盖。会话列表必须监听 SDK 5.0 `ChatManager.onConversationListUpdate`，直接使用事件 `items` 作为权威快照；群解散后页面移除群会话必须来自 SDK 5.0 会话列表更新事件，不得只凭群事件本地伪造删除。聊天室消息不会产生会话；收发消息、拉取历史、撤回、编辑、删除等 message-driven 路径不得为 `CONVERSATION_TYPE.CHATROOM` 调用 `updateConversationList` 创建或刷新聊天室会话；若 SDK 会话列表事件真实返回聊天室项，只能按原始结果暴露并定位 SDK/服务端行为，不能本地伪造或隐藏。`clearConversationUnreadMessageCount` 仅对单聊和群聊发起；聊天室不支持时不调用且不本地伪造清零。全会话未读清零必须调用 SDK 5.0 `clearAllConversationUnreadMessageCount()`，清空全部消息与会话必须调用 `clearAllMessagesAndConversations()`；两者均只在 SDK resolve 后更新本地展示，失败保留真实错误。
- 联系人快照刷新时机：好友关系建立的 `onContactAdded` / `onContactAgreed` 仍从已更新的 SDK 5.0 `contactManager.getContacts()` 快照刷新；用户同意好友申请后，必须在真实 `ChatClient.onSyncDataFinished({ dataType: 'contact', status: 'success' })` 触发时再次读取该快照并刷新 Vuex 联系人列表。同步失败只打印 SDK 原始 payload/error，不本地补造联系人或猜测事件目标。
- 会话列表为群聊会话补充详情时，只能调用 SDK 5.0 `groupManager().getGroup(groupId).getDetail()`。批量中某个群返回 `service_resource_not_found` / 404 / 303 时，这是该群的真实 SDK/服务端失败，必须记录原始错误并返回失败项；不得伪造群详情，也不得让一个失败吞掉其他群真实成功详情。
- 用户资料、登录后刷新当前用户真实在线状态、在线状态切换、个人设置、SDK 日志与退出登录；当前用户资料查询必须调用 SDK 5.0 `UserInfoManager.getUserInfoByUserId({ userIds: [userId] })`，SDK 返回空数组表示服务端未命中资料，Demo 只记录 warning 和真实当前 `userId` 作为本地显示上下文，不抛登录初始化错误、不伪造昵称/头像/资料、不写入用户资料缓存。用户资料扩展能力必须只调用 SDK 5.0 `UserInfoManager.addEventHandler(handlerId, handlers)`、`removeEventHandler(handlerId)`、`getUserInfoByAttribute({ userIds, attributes })`、`subscribeUsersInfo({ userIds })`、`unsubscribeUsersInfo({ userIds })`、`getSubscribedUsers()`、`updateOwnInfoByAttribute(attribute, value)`，页面展示真实返回、真实错误和事件日志，不读取旧字段或本地回填。
- Push 扩展能力必须只调用 SDK 5.0 公开 `uploadPushToken({ deviceId, deviceToken, notifierName })`、`setGlobalSilentMode({ rule })`、`getGlobalSilentMode()`、`getConversationSilentModes({ conversationList })`、`setPushLanguage({ language })`、`getPushLanguage()`、`getConversationListByRemindType({ pageSize, cursor })`；Push Token 只能来自用户输入，不生成假 token，不把聊天室传入只支持单聊 / 群聊的批量会话免打扰查询；失败展示 SDK / 服务端真实错误。
- 个人设置的 SDK 5.0 诊断入口必须直接调用 `ChatClient.getSelfIdsOnOtherPlatform()`、`ChatClient.getUserIdsWithRTCUids(rtcUids)`、`ChatManager.voiceFileToText(file, voiceParams)`；RTC UID 必须由用户输入并按数字数组传递，语音文件必须直接传浏览器选择的原始 `File`，`voiceParams` 仅传用户明确填写的 `format`。SDK 返回的其他设备 `userId/resource`、RTC UID 映射和 `{ text }` 转写结果直接展示，未命中、格式错误、服务未开通或调用失败均保留原始 SDK / 服务端结果，不补值、不改走 REST、不重试。
- 单聊/群聊消息收发、透传消息发送与接收展示、只投在线用户发送开关（含开关切换 toast 和 console 日志）、消息工具栏图标悬停显示功能名称、服务端消息搜索（单聊/群聊/聊天室当前会话或全部可见会话，支持关键词、关键词关系、消息类型、搜索内容范围、可选日期时间范围和分页；未开通服务、关键词个数或长度超限时按服务端真实错误提示并保留 console 日志）、文本消息翻译（先调用 SDK 5.0 `getSupportedTranslationLanguages()` 获取真实语言列表，再调用 `translateMessage({ message, targetLanguages })`，只展示真实 `detectedLanguage` 和 `translations`，失败不兜底）、语音消息转文字（对已有语音消息调用 SDK 5.0 `voiceMessageToText(message.body)`，只展示真实 `text`，失败不兜底）、附件下载（图片 / 视频 / 文件 / 语音消息只能调用 SDK 5.0 `downloadAttachment({ message })`，展示 SDK 返回 `filename/mimeType/size/downloadUrl/data` 摘要；失败不得回退直链伪造成 SDK 下载成功）、消息引用、复制、撤回、编辑、删除、置顶、置顶消息列表（调用 `getPinnedMessageList({ conversationId, conversationType })` 并直接展示 SDK 返回 `items`）、消息送达回执、消息已读回执、群消息已读人数、群消息已读用户列表（`getGroupMessageReadUsers({ groupId, messageId, cursor, pageSize })`）、群消息回执详情（`getGroupMessageReadReceipts({ groupId, messageIds })`）；撤回消息必须只调用 SDK 5.0 `recallMessage({ conversationId, conversationType, messageId })`，成功后本地只标记真实消息为撤回；撤回后的会话快照刷新如果遇到 SDK cache 暂无该会话，只能记录包含 currentUser/conversationId/conversationType 的非阻塞 warning，不得以 `console.error` 或 toast 展示为撤回失败。消息事件监听生命周期必须使用 SDK 5.0 `ChatManager.addEventHandler(handlerId, handlers)` 与 `removeEventHandler(handlerId)` 成对处理；注册前先清理同 ID 监听，禁止恢复 SDK 4.0 聚合事件、旧字段或重复监听兜底。引用消息发送时仅将 SDK 5.0 原始 Message 直接置于 `ext.quote`，展示和定位只读取该原始对象的 `msgServerId`、`msgLocalId`、`sender`、`type`、`body`，禁止生成旧引用模型或字段。单聊与群聊文本消息均必须以 `needReadReceipt: true` 请求 SDK 5.0 已读回执；接收端仅在首次入库的 SDK 5.0 `direct: 'RECEIVE'`、`needReadReceipt: true` 消息上调用 `sendMessageReadReceipts({ conversationId, conversationType, messageIds })`，不为聊天室、本人消息、重复消息或流式后续分片发送回执；只有收到 SDK 单聊 `isPeerRead` / 已读回执或群聊回执中的真实 `receiptDetails` 后，才显示绿色已读勾和对应群已读人数，不得本地推断已读状态。SDK 5.0 `onMembersExited` 仅展示其 `groupId` 和 `members`，并按其定义展示“成员退出群组”；未下发操作者时不得伪造成“谁移除成员”；单聊右侧资料面板支持设置好友备注、消息免打扰、加入/移出黑名单、查看黑名单列表并移出用户、清空聊天记录和删除联系人；其中备注、删除联系人和加入/移出黑名单只能使用 SDK 5.0 当前会话快照、联系人快照或消息 `sender.userId` 真实解析出的用户 ID，禁止把 `conversationId` 当作联系人 `userId` 传给 ContactManager；未解析到用户 ID 时必须展示真实原因和 console 上下文，并停止调用联系人 API。黑名单加入只可在 SDK 5.0 `addUsersToBlocklist({ userIds })` 的 `succeeded` 确认包含目标用户后展示成功；服务端 `204` 等失败保留原状态、原始错误及当前用户/目标用户上下文，不使用本地成功或重试兜底。群聊消息支持右键创建消息话题、群组子区列表查看并进入话题会话，并支持消息话题会话内返回父群组、发送、接收、撤回、获取历史消息和批量获取消息话题最新消息；支持加入、退出、改名、解散消息话题，查看消息话题详情与成员列表并移出成员，查看我加入的消息话题列表，监听消息话题事件。消息举报当前为 SDK 5.0 未支持能力。
- 已读回执点击时序（覆盖上文所有“首次入库”或“接收事件先清零”的表述）：接收方点击单聊或群聊会话时，会话列表先调用 `clearConversationUnreadMessageCount({ conversationId, conversationType })`；进入消息页并取得 SDK 5.0 历史消息后，仅以真实 `direct: 'RECEIVE'`、`needReadReceipt: true`、`msgServerId` 发送 `sendMessageReadReceipts`。聊天室不调用。收到在线消息本身不得清零未读数；已打开且可见的当前会话仅可基于上述真实接收消息发送已读回执，绝不使用本地 ID 或未读数推断。
- 当前会话文本消息的 `SDK5 Client.sendMessage` 测试入口必须先通过 `ChatManager.createTextMessage` 构造 SDK 5.0 原始 `Message`，再直接调用 `getClient().sendMessage(message, options)`；成功只展示 SDK 原始回包并打印完整 Console 日志。`ChatClient.sendMessage` 失败后不得回退 `ChatManager.sendMessage`、自动重试或本地伪造成功。单聊、群聊、聊天室均须以真实 SDK 回包与接收端 `onMessage` 日志分别验证；静态源码覆盖不等于真实通过。
- 群组详情、群头像、群扩展信息、群公告、群共享文件、群成员、黑名单、白名单、禁言、退群与解散群组；创建群组严格调用 SDK 5.0 `groupManager.createGroup({ name, description, memberIds, public, joinApprovalRequired, allowInvites, inviteNeedConfirm, maxMembers, ext, avatar })`，不得保留旧 SDK 创建群参数。群摘要和详情只读取 SDK 5.0 的 `name`、`memberCount`、`avatarUrl`、`maxMembers`、`allowInvites`；字段未下发时展示缺失值而不回退旧字段或伪造默认人数。群轻量摘要必须只调用 SDK 5.0 公开 `groupManager.getGroup(groupId).getSummary()`，展示真实 `JoinedGroupSummary | null`，SDK 返回 null 时如实展示，不通过 getDetail 或本地状态伪造摘要。群资料修改必须调用 `groupManager.getGroup(groupId).updateInfo({ name / description / avatar / ext })` 后调用 `refresh()`，只提交并展示返回的原始 `GroupDetail`，禁止本地回填、旧 `updateGroupInfo` 入口或群成员属性缓存。群配置更新和群主转让必须只调用 SDK 5.0 公开 `groupManager.getGroup(groupId).updateConfigs({ public, joinApprovalRequired, allowInvites, inviteNeedConfirm, maxMembers })` 与 `changeOwner({ newOwner })`；页面不为未下发配置字段补默认值，只提交用户明确选择的字段，成功后调用 `refresh()` 并展示 SDK 真实 `GroupDetail`，失败保留 SDK / 服务端真实错误。群成员与定向消息默认接收人必须通过公开 API `groupManager.getGroup(groupId).getMembers({ cursor, pageSize })` 获取，并严格读取每项的 `user.userId`、`role`、`joinedAt`；资料未下发昵称时展示真实 userId。群管理员必须只调用 SDK 5.0 公开 `groupManager.getGroup(groupId).getAdmins()`、`addAdmin({ userId })`、`removeAdmin({ userId })`；页面直接展示真实 `GroupUserInfo[]` 的 `admin.userId`，添加候选人只来自真实群成员列表，成功后重新查询管理员和成员列表，失败保留 SDK / 服务端真实错误，不本地回填。群成员属性 / 群名片必须只调用 SDK 5.0 公开 `groupManager.getGroup(groupId).setMemberAttributes({ userId, memberAttributes })` 和 `getMembersAttributes({ userIds, keys })`；页面展示 SDK 返回的真实 `items` 和原始属性 JSON，失败保留 SDK / 服务端真实错误，不恢复旧本地昵称 Store 契约或用用户资料兜底。群白名单必须只调用 SDK 5.0 公开 `groupManager.getGroup(groupId).getAllowlist()`、`addUsersToAllowlist({ userIds })`、`removeUsersFromAllowlist({ userIds })`、`checkIfInAllowList()`；页面按 `entry.user.userId` 展示 SDK 返回的白名单成员和当前用户真实 boolean，失败保留 SDK / 服务端真实错误，不本地回填、不调用 internal Manager 转发方法。邀请列表只展示当前未在群内的好友，邀请失败保留 SDK / 服务端真实错误；群禁言必须只调用 SDK 5.0 公开 `groupManager.getGroup(groupId).getMuteList()`、`muteMembers({ userIds, muteDuration })`、`unmuteMembers({ userIds })`、`muteAllMembers()`、`unmuteAllMembers()`、`checkIfInMuteList()`；禁言名单按 `user.userId`、`muteExpire` 展示，全员禁言成功后只用 `refresh()` 的真实 `GroupDetail.muteAllMembers` 展示，当前用户禁言状态只展示 `checkIfInMuteList()` 的真实 boolean，失败保留 SDK / 服务端真实错误，不本地回填、不调用 internal Manager 转发方法。群组通知必须监听 SDK 5.0 的命名事件并按公开载荷字段展示：禁止监听或读取 SDK 4.0 群组聚合事件及其旧字段；通知群 ID 使用 `groupId`，成员/操作者从 `members`、`inviter`、`applicant`、`invitee`、`administrator`、`oldOwner`、`newOwner`、`mutes`、`allowlist` 等 UserInfo 字段读取。SDK 未下发用户资料时显示空的真实信息，不显示 `undefined` 或本地虚构操作者。屏蔽群消息当前为 SDK 5.0 无公开 API 的能力，Demo 不提供入口。
- 单聊/群聊 Reaction。
- 单聊/群聊消息回执展示只直接消费 SDK 5.0 原始字段：发送方判断优先使用 `direct: 'SEND'`，无 `direct` 时才读取 SDK 5.0 `sender.userId`，不得补造 sender。单聊发送方使用 `delivered` 与 `isPeerRead`，群聊发送方使用 `delivered` 与 `groupReadCount`。两者在同一位置将送达展示为绿色 `✓`；单聊收到真实 `isPeerRead === true`、或群聊收到真实 `groupReadCount > 0` 后展示绿色 `✓✓` 并覆盖送达图标；群聊继续展示真实已读人数。接收方不得显示对方消息的回执图标，禁止通过本地状态、旧字段或兼容映射推断已读。
- 聊天室列表、加入退出、详情刷新、公告、自定义属性、成员管理；聊天室公开列表调用失败必须保留 SDK / 服务端真实错误；仅 token 失效、未登录或未授权才清除过期登录态并回到登录页，权限拒绝（`210`）以及 SDK 映射为 `202` 但 `details.reason` 明确为黑名单的业务拒绝必须留在当前页展示原始错误，不重试、不伪造列表。聊天室基础资料刷新必须只调用 SDK 5.0 公开 `chatRoomManager.getChatRoom(chatRoomId).refresh()`，并展示返回的真实 `ChatRoomDetail`，失败保留 SDK / 服务端真实错误，不用 `getInfo` 或本地状态伪造成 refresh 成功；成员列表调用 SDK 5.0 `chatRoomManager.getChatRoom(chatRoomId).getMembers({ cursor, pageSize })`，并仅按返回项 `user.userId` 展示真实成员；聊天室当前用户禁言状态必须只调用 SDK 5.0 `chatRoomManager.getChatRoom(chatRoomId).checkIfInMuteList()`，展示真实 `ChatRoomMuteStatus.muted` 和 `muteExpireAt`；查询失败要展示原始错误，禁止把失败或未查询状态显示成“未禁言”；非所有者/管理员未拉取禁言列表时不得展示“当前没有被单独禁言的用户”。文本消息 @ 候选也必须按真实 `conversationType` 分流：仅群聊调用 `groupManager.getGroup(groupId).getMembers({ cursor, pageSize })`，聊天室只调用 `chatRoomManager.getChatRoom(chatRoomId).getMembers({ cursor, pageSize })`，不得将聊天室 ID 传给群组接口；公开列表仅展示 SDK 5.0 返回的聊天室，不会通过批量详情请求伪造“已加入”分类；`ChatRoomDetail.permissionType` 是详情权限字段，不能替代当前 SDK 5.0 连接的入会结果。只有本次运行中 `joinChatRoom` 的真实成功结果可将该房间操作切换为“进入聊天室”，该确认状态保存在应用级内存以跨主导航保留，退出登录或真实退出聊天室成功时清空；点击后仅进入消息页。加入请求进行中会阻止同一聊天室重复提交，失败不改变该状态。聊天室解散、查询已加入聊天室列表和聊天室消息免打扰当前为 SDK 5.0 未支持能力。
- 群组全部 26 个 SDK 5.0 `GroupEventName` 命名事件触发时必须直接打印事件名、原始 payload、payload.groupId 与当前用户，不能用本地模拟事件替代。
- 群公告弹窗必须按真实 `memberRole` 区分：普通成员只读展示公告，不能进入编辑态、聚焦不存在的输入框或调用更新公告 API；群主/管理员才可编辑，并保留 SDK / 服务端更新失败原始错误。
- 聊天室全部 16 个 SDK 5.0 命名事件必须在登录后由全局 `ChatRoomManager.addEventHandler` 注册；触发时直接打印 handlerId、事件名、原始 rawEvent、payload.chatRoomId 与当前用户。详情和成员管理页只按 payload 原始 `chatRoomId` 刷新数据，不重复打印事件日志，不能用本地模拟事件替代。
- 聊天室列表页面挂载期间收到 SDK 5.0 `onMembersJoined` 后，必须重新调用公开 `ChatRoomManager.getChatRoomList({ pageNum, pageSize })` 读取服务端返回的 `ChatRoomSummary.memberCount`；不从事件 `members` 做本地加一、减一或任何人数补值。列表未挂载时，返回列表的首次查询仍直接读取 SDK 真实结果。
- SDK 5.0 事件中心必须只记录真实命名回调：Vuex 单条记录仅保留 `domain`、`eventName`、`payload`、`receivedAt`、`currentUserId`，其中 `payload` 不转换、不补值。页面必须按“单聊事件 / 联系人事件 / 群组事件 / 聊天室事件”清晰筛选展示事件名、时间、目标 ID、当前用户和原始 payload；消息类事件仅按公开 `conversationType` 分类，联系人事件仅从 `ContactManager` 命名回调分类，目标只读取 SDK 原始 `userInfo.userId` 或 `applicant.userId`，群组和聊天室管理事件仅从对应 Manager 回调分类。左侧事件预览与事件中心记录必须共享同一次 SDK 回调的 `domain`、`eventName`、`receivedAt`；点击预览后只可展示这条精确匹配的原始记录，匹配不到必须明确显示未找到，禁止显示另一条最新事件。HTTP 请求或 Promise resolve 不能作为接收事件记录；没有回调必须显示未收到事件，禁止本地合成通知或恢复 V4 聚合模型。
- `GroupManager.inviteUsersToGroup({ groupId, userIds })` Promise resolve 后必须输出包含 `groupId`、`userIds`、当前用户和原始 result 的发送端成功日志；该日志只表示邀请请求被 SDK / 服务端接受，不能表示被邀请方已收到 `onInvitationReceived` 或 `onAutoAcceptInvitationFromGroup`。
- 聊天室列表直接展示 SDK 5.0 `ChatRoomSummary.chatRoomId`；不得展示固定描述占位文案，也不得为列表描述额外请求详情。
- 聊天室消息全链路能力，文本消息同样支持通过 SDK 5.0 `translateMessage({ message, targetLanguages })` 翻译并按真实返回展示，语音消息同样支持通过 `voiceMessageToText(message.body)` 转文字并按真实返回展示；NGI 聊天室发送合并消息的历史实测下行为 `type: 'text'` 的“版本过低”兼容文本，而非 `type: 'combine'`。当前环境需重新实测；未复测前不得标为通过，也禁止前端伪造成合并消息。详见 `docs/sdk5-unsupported-capabilities.md`。

- 进入消息页必须调用 SDK 5.0 `setCurrentConversation({ conversationId, conversationType })`，展示 `getCurrentConversation()` 真实返回，切换或离开消息页必须调用 `resetCurrentConversation()`；该状态仅用于验证 SDK 当前会话的在线消息未读规则，不做本地未读补偿或兜底。

## 9. 功能清单维护规则

后续每次新增、删除或调整用户可见功能时，必须同步维护以下文档：

1. `cases_list.md`
   规则：
   只保留两列：`模块`、`具体功能`。
   一个模块占一行，`具体功能` 使用 `<br>` 换行罗列该模块下的功能点。
   优先写“用户实际能做什么”，不要写实现细节、接口名或测试名。

2. `.codex/prompts/superpowers.md`
   规则：
   维护当前功能基线摘要，确保与 `cases_list.md` 一致。
   当新增一个功能模块或明显扩展某模块能力时，要同步补充这里的概述。
   如果功能被下线或范围收缩，也要同步删除或改写对应描述。

## 聊天室事件基线

- 聊天室仅注册 WebSDK 5.0 命名事件回调，并直接读取 payload 的 `chatRoomId`；不得恢复 `onChatroomEvent`、`operation`、`roomId` 或任何事件适配器。EaseCallKit 信令仅使用 `chatManager.createTextMessage/createCmdMessage`、`sendMessage` 和 `onMessage`，并从 `ChatClient` 公开方法读取当前用户、设备资源与 RTC token。

## 10. 强制同步要求

- 每次添加功能后，自动同步更新 `cases_list.md` 和 `.codex/prompts/superpowers.md`。
- 每次删除功能后，自动同步更新 `cases_list.md` 和 `.codex/prompts/superpowers.md`。
- 每次修改功能范围、入口、支持场景后，自动同步更新 `cases_list.md` 和 `.codex/prompts/superpowers.md`。
- 每次确认 SDK 5.0 不支持一项现有页面能力后，自动更新 `docs/sdk5-unsupported-capabilities.md`。
- 每次确认 SDK 5.0 已公开但当前 Demo 未覆盖一项用户可见能力后，自动更新 `docs/sdk5-uncovered-capabilities.md`；实现后删除该项并同步写入功能清单。
- 每次升级 `easemob-websdk` 包、发现公开 API 增减、或调整 Demo 对 SDK 5.0 API 的覆盖入口后，自动更新 `docs/sdk5-api-coverage.md`；该文档按当前安装包类型声明统计未标记 `@internal` 的公开对外 API，并标注“是 / 否 / 部分覆盖”。`@internal`、私有方法、`bind`、raw notify、同步控制器和 SDK 内部生命周期入口不进入覆盖率分母，也不登记为未覆盖能力。
- 提交前必须检查 `cases_list.md`、`.codex/prompts/superpowers.md`、`docs/sdk5-unsupported-capabilities.md`、`docs/sdk5-uncovered-capabilities.md` 和 `docs/sdk5-api-coverage.md` 是否仍与当前实现一致。

- 会话右键菜单在单聊和群聊上提供手动“清空未读”，调用 `clearConversationUnreadMessageCount({ conversationId, conversationType })`；SDK resolve 后才更新本地未读数，reject 时保留未读数和原始错误。点击进入会话的既有自动清零不变；聊天室不展示该菜单项。

## 11. 判定口径

维护功能清单时，按以下优先级判断是否应写入：

1. 页面或交互中已有真实入口。
2. `src/` 下已有真实实现，且当前页面能直接触达或承载该能力。
3. README 中已有说明，且与当前实现一致。
4. 属于用户可感知能力，而不是纯内部工具、调试逻辑、测试造数逻辑或自动化测试场景。

额外规则：

- `tests/` 目录中的用例、夹具、页面对象、并发脚本、双账号脚本，只能作为验证手段，不能单独作为功能清单来源。
- 像“双账号联调”“自动造数”“测试专用脚本”这类内容，不写入 `cases_list.md`。

如出现 README、测试、实现不一致，以“当前页面真实实现 + 当前可运行行为”为准，再补齐文档。
