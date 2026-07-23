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
- 当前分支必须零保留 SDK 4.0 代码及兼容代码：禁止保留或新增 V4 参数/事件/消息字段转换器、聚合事件适配器、双路径、旧字段别名、`EMClient`/`conn` 发送入口；迁移必须删除旧路径并让 UI、Store、日志直接消费 SDK 5.0 公开模型
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

- Web demo 以真实暴露服务端与 SDK 行为为前提，不提供客户端伪成功兜底。
- IM 能力唯一依赖本地 `easemob-websdk 5.0.1`；初始化使用 `ChatClient` 与领域 Manager，禁止恢复 v4 `EMClient`、`conn`、私有子路径或兼容层。
- 任意 WebSDK 5.0 调用前，必须以当前安装包的公开 TypeScript 类型声明和方法签名逐项核对参数名、必填项、类型和返回字段；不得传递旧 SDK 字段、同义映射或兼容参数。发现不一致时，先通过定向回归测试覆盖完整公开契约，再仅修改 Demo 调用层；不得修改 SDK tgz、SDK 源码或以本地默认值伪造服务端成功。
- 服务端失败提示需与真实错误语义一致，同一次失败仅保留一条完整错误日志用于排查。
- 控制台会完整输出 SDK 5.0 调用、响应、事件、失败与重连日志，并用前缀区分 SDK 原始日志、App 事件派发、Store/UI 外层处理日志，便于排查 socket、消息和聊天室链路。
- SDK 5.0 登录只接受环信 ID 与 Token。NGI 与线上 VIP6 必须使用 SDK DNS 获取与 AppKey 匹配的真实 REST/WS 地址；仅在 TKE/DEV/QA隔舱等用户明确选择的私有化环境传 `serviceConfig.serverUrls` 固定地址，禁止为“可用”而把 Token 强制发送到历史默认集群。
- 不得在 SDK 5.0 `onConnected` 事件中调用依赖会话 REST 上下文的 Manager。联系人、资料、在线状态、群组与会话初始化只能在 `await client.login()` 成功后执行，并通过公开 `client.getCurrentUserId()` 获取当前用户；禁止读取 v4 风格的实例字段。登录成功后使用 SPA 路由，不刷新页面并触发第二次登录。Provision 拒绝必须输出脱敏的 AppKey、服务模式/地址、用户 ID、Token 长度及 SDK `statusCode/reason`，不得打印 Token 明文或伪造成功。
- SDK 消息解析空引用异常会保留原始错误日志并阻止开发态全屏错误覆盖层，不包装成成功结果。
- IM 连接断开、发送超时等真实失败仅打印到控制台，不使用开发态全屏错误覆盖层遮挡页面。
- UI 离线提示严格跟随 SDK 5.0 连接事件：`onConnecting` 显示离线，收到真实 `onConnected` 后恢复在线；不得因先前连接过程遗留离线提示而掩盖已成功建立的连接。
- socketUrl 显式配置 `ws://` 或 `wss://` 时原样使用，未配置协议时默认补 `wss://`。
- SDK 5.0 消息和历史消息以 `msgServerId`、`msgLocalId`、`conversationId`、`conversationType`、`sender`、`timestamp`、`type`、`body`、`ext` 为唯一真实契约；UI、Store 与日志直接消费这些字段，禁止映射至 `id/mid/to/from/chatType/msg` 或其他 V4 展示模型。历史查询和会话未读清零的调用者必须显式传入 `conversationId`、`conversationType`，不得透传旧路由对象或旧字段。定向消息组件、成员查询和发送请求同样只可使用这两个会话字段与 `receiverList`。服务端实际缺字段时清晰报错，不本地推断会话类型。`groupChat` 与 `chatRoom` 定向消息的接收人必须在创建消息时以 `receiverList` 传入；禁止把它放在 `sendMessage` options 后仍把广播结果显示为定向成功。跨端编辑和撤回仅按事件的 `messageId/conversationId/conversationType` 定位；SDK 未下发完整定位字段时保留真实事件和错误，不用 V4 本地字段补齐。
- 使用环信 ID 与 Token 的 SDK 5.0 登录、NGI/线上 VIP6/TKE/DEV/QA隔舱服务配置、主导航显示当前运行环境、会话管理、单个会话推送通知方式与免打扰时长、联系人详情与好友关系维护。发起好友申请必须使用 SDK 5.0 `contactManager.addContact({ userId, message })`；接收端仅由真实 `onContactInvited` 回调创建好友申请通知，SDK/服务端未下发时不轮询联系人列表或补造通知。好友关系建立时，SDK 5.0 `onContactAdded` / `onContactAgreed` 已更新联系人快照，Demo 必须从 `contactManager.getContacts()` 刷新展示，禁止从旧事件 `from` 字段猜测好友 ID 或改写 SDK 回调字段。在线状态订阅仅将 SDK 5.0 联系人快照的真实、非空 `userId` 作为 `subscribePresence({ userIds })` 参数。`clearConversationUnreadMessageCount` 仅对单聊和群聊发起；聊天室不支持时不调用且不本地伪造清零。
- 用户资料、登录后刷新当前用户真实在线状态、在线状态切换、个人设置、SDK 日志与退出登录。
- 单聊/群聊消息收发、透传消息发送与接收展示、只投在线用户发送开关（含开关切换 toast 和 console 日志）、消息工具栏图标悬停显示功能名称、服务端消息搜索（单聊/群聊/聊天室当前会话或全部可见会话，支持关键词、关键词关系、消息类型、搜索内容范围、可选日期时间范围和分页；未开通服务、关键词个数或长度超限时按服务端真实错误提示并保留 console 日志）、消息引用、复制、撤回、编辑、删除、置顶、消息送达回执、消息已读回执、群消息已读人数；群聊文本消息发送时开启群消息已读回执统计；SDK 5.0 `onMembersExited` 仅展示其 `groupId` 和 `members`，并按其定义展示“成员退出群组”；未下发操作者时不得伪造成“谁移除成员”；单聊右侧资料面板支持设置好友备注、消息免打扰、加入/移出黑名单、查看黑名单列表并移出用户、清空聊天记录和删除联系人。黑名单加入只可在 SDK 5.0 `addUsersToBlocklist({ userIds })` 的 `succeeded` 确认包含目标用户后展示成功；服务端 `204` 等失败保留原状态、原始错误及当前用户/目标用户上下文，不使用本地成功或重试兜底。群聊消息支持右键创建消息话题、群组子区列表查看并进入话题会话，并支持消息话题会话内返回父群组、发送、接收、撤回、获取历史消息和批量获取消息话题最新消息；支持加入、退出、改名、解散消息话题，查看消息话题详情与成员列表并移出成员，查看我加入的消息话题列表，监听消息话题事件。消息举报当前为 SDK 5.0 未支持能力。
- 群组详情、群头像、群扩展信息、群公告、群共享文件、群成员、黑名单、禁言、退群与解散群组；创建群组严格调用 SDK 5.0 `groupManager.createGroup({ name, description, memberIds, public, joinApprovalRequired, allowInvites, inviteNeedConfirm, maxMembers, ext, avatar })`，不得保留 `createGroupVNext` 字段。群摘要和详情严格读取 SDK 5.0 的 `name`、`memberCount`、`avatarUrl`、`maxMembers`、`allowInvites`，字段未下发时展示缺失值而不回退旧字段或伪造默认人数；群成员与定向消息默认接收人必须通过公开 API `groupManager.getGroup(groupId).getMembers({ cursor, pageSize })` 获取，并严格读取每项的 `user.userId`、`role`、`joinedAt`；资料未下发昵称时展示真实 userId。邀请列表只展示当前未在群内的好友，邀请失败保留 SDK / 服务端真实错误；群禁言名单按 SDK 5.0 `user.userId`、`muteExpire` 展示。修改群名称调用 SDK 5.0 `updateGroupInfo` 的 `name` 入参，修改群头像调用其 `avatar` 入参，页面保留 SDK/服务端的原始成败结果。群组通知必须监听 SDK 5.0 的命名事件并按公开载荷字段适配：禁止监听 v4 `onGroupEvent` 或读取其 `id/from/operation`；通知群 ID 使用 `groupId`，成员/操作者从 `members`、`inviter`、`applicant`、`invitee`、`administrator`、`oldOwner`、`newOwner`、`mutes`、`allowlist` 等 UserInfo 字段读取。SDK 未下发用户资料时显示空的真实信息，不显示 `undefined` 或本地虚构操作者。屏蔽群消息当前为 SDK 5.0 未支持能力。
- 单聊/群聊 Reaction。
- 聊天室列表、加入退出、详情刷新、公告、自定义属性、成员管理；成员列表调用 SDK 5.0 `getMemberList({ chatRoomId, cursor, pageSize })`，并仅按返回项 `user.userId` 展示真实成员；公开列表仅展示 SDK 5.0 返回的聊天室，不会通过批量详情请求伪造“已加入”分类；单房间成员关系以详情 `permissionType` 为准。只有本次运行中 `joinChatRoom` 的真实成功结果可将该房间操作切换为“进入聊天室”，该确认状态保存在应用级内存以跨主导航保留，退出登录或真实退出聊天室成功时清空；点击后仅进入消息页。加入请求进行中会阻止同一聊天室重复提交，失败不改变该状态。聊天室解散、查询已加入聊天室列表和聊天室消息免打扰当前为 SDK 5.0 未支持能力。
- 聊天室消息全链路能力；但当前 SDK 5.0.0 在 NGI 聊天室发送合并消息时，下行实际为 `type: 'text'` 的“版本过低”兼容文本，而非 `type: 'combine'`。该失败必须如实展示和登记，禁止前端伪造成合并消息。详见 `docs/sdk5-unsupported-capabilities.md`。

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
- 提交前必须检查 `cases_list.md`、`.codex/prompts/superpowers.md`、`docs/sdk5-unsupported-capabilities.md` 和 `docs/sdk5-uncovered-capabilities.md` 是否仍与当前实现一致。

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
