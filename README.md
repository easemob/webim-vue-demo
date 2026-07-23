> Easemob WebIM Vue Demo

# webim-vue3-demo

`webim-vue3-demo` 是基于 Vue 3、Vuex、Element Plus 和本地构建 `easemob-websdk 5.0.0` 的环信 Web IM Demo。本项目当前定位是 Web 端真实能力验证工具：页面和控制台应直接暴露 SDK 5.0 / 服务端的真实成功、失败、事件字段和错误信息，不通过客户端模拟成功、自动重试、静默降级或本地兜底来掩盖服务端行为。

当前 Demo 覆盖单聊、群聊、聊天室、消息话题/群组子区、会话、联系人、群组管理、聊天室管理、消息收发、消息交互、Reaction、在线状态和音视频通话示例等能力。
消息页还提供服务端消息搜索入口，用于验证 `chatManager.searchMessages` 的真实服务端搜索能力。

## 运行

语音录制/播放等浏览器能力建议使用 HTTPS 环境验证。

当前项目脚本来自 [package.json](./package.json)：

```bash
# 安装依赖
npm install
# 或
yarn install

# 本地开发
npm run dev
# 或
yarn run dev

# 生产构建
npm run build
# 或
yarn build

# 格式化
npm run format
```

当前项目未保留端到端自动化配置、用例代码或相关依赖。

## 技术栈

- Vue 3
- Vue Router
- Vuex
- Element Plus
- easemob-websdk
- Agora RTC SDK
- Vue CLI

## 项目结构

| 路径 | 说明 |
| --- | --- |
| [src/](./src) | 项目源代码 |
| [src/IM/](./src/IM) | WebIM SDK 初始化、配置、监听、miniCore 包装 |
| [src/router/](./src/router) | 页面路由 |
| [src/store/](./src/store) | Vuex 状态管理 |
| [src/views/Chat/](./src/views/Chat) | 会话、联系人、聊天室、消息主界面 |
| [src/components/](./src/components) | 公共组件与 EaseCallKit |
| [src/utils/](./src/utils) | 通用工具、错误处理、鉴权跳转、消息工具 |
| [public/](./public) | 静态 public 资源 |
| [dist/](./dist) | 构建产物 |
| [cases_list.md](./cases_list.md) | 当前 Demo 功能清单 |
| [.codex/prompts/superpowers.md](./.codex/prompts/superpowers.md) | Codex 项目行为与能力说明 |

## Demo 行为约束

- Web 端用于验证真实 SDK / 服务端能力。
- SDK 调用失败时，页面应保留失败提示，控制台应保留完整错误上下文。
- 不把失败包装成成功，不做自动重试、模拟成功、静默降级、客户端假数据补齐。
- SDK 与 REST 行为不一致时，应暴露差异，不合并成一个“成功体验”。
- `chatType` 等关键字段缺失时应清晰报错，不随意推断为单聊、群聊或聊天室。
- 失败不应导致页面不可用；页面应保持可操作并展示正常错误反馈。

## 核心能力

### 登录与环境

- 用户登录并缓存登录态。
- 支持切换 NGI、线上 VIP6、TKE、DEV、QA 隔舱等服务环境配置。
- 未登录访问聊天页时走登录态检查和跳转。
- 登录后展示当前运行环境。

相关入口：

- [登录页](./src/views/Login/)
- [SDK 配置](./src/IM/config/index.js)
- [SDK 连接监听](./src/IM/listener/imConnectListener.js)
- [鉴权跳转工具](./src/utils/imAuthRedirect.js)

### 会话

- 展示服务端/本地同步的会话列表。
- 会话搜索。
- 查看标星会话。
- 会话右键菜单：置顶、标星、推送通知设置、删除。
- 设置/清除单个会话推送通知方式。
- 设置单个会话免打扰时长。
- 清除会话未读数和提及状态。

相关入口：

- [会话组件](./src/views/Chat/components/Conversation/)
- [会话状态](./src/store/modules/conversation.js)
- [搜索组件](./src/components/SearchInput/index.vue)

### 联系人

- 展示好友列表和群组列表。
- 联系人搜索与刷新。
- 查看系统通知。
- 进入联系人详情页。
- 删除好友、加入黑名单、移出黑名单。
- 订阅、取消订阅、刷新联系人在线状态。
- 从联系人发起单聊会话。
- 从群组列表进入群聊会话。

相关入口：

- [联系人组件](./src/views/Chat/components/Contacts/index.vue)
- [联系人详情](./src/views/Chat/components/Contacts/components/ContactInfos.vue)
- [系统通知](./src/views/Chat/components/InformDetails/index.vue)

### 用户资料与设置

- 展示当前用户头像和基础信息。
- 编辑用户资料。
- 登录后刷新当前用户真实在线状态。
- 切换在线状态，发布自定义在线状态。
- 新消息提示音开关。
- SDK 日志开关。
- 下载 SDK 缓存日志。
- 查看运行环境详情、在线状态订阅列表、黑名单列表。
- 退出登录。

相关入口：

- [用户信息](./src/views/Chat/components/NavBar/components/AboutUserInfoCard/)
- [个人设置](./src/views/Chat/components/NavBar/components/PersonalsettingCard/index.vue)
- [在线状态](./src/views/Chat/components/NavBar/components/UserOnlineStatusCard.vue)
- [退出登录](./src/views/Chat/components/NavBar/components/Logout.vue)

### 创建与申请

- 添加好友。
- 创建群组，支持填写群头像和群扩展信息。
- 创建聊天室。
- 申请入群。

相关入口：

- [创建/申请入口](./src/views/Chat/components/NavBar/components/ApplyComponents/)

## 消息能力

### 基础收发

单聊、群聊、聊天室共享消息输入栏能力：

- 文本消息。
- 图片消息。
- 文件消息。
- 视频消息。
- 语音消息。
- 位置消息。
- 表情文本消息。
- 扩展文本消息。
- 自定义消息。
- 透传消息。
- 合并消息。
- 个人名片消息。
- 定向消息。
- 清空当前会话消息展示。
- 空消息拦截。

消息工具栏图标支持悬停显示功能名称。可见图标使用同一套 `title` 文案，例如“发送图片”“发送文件”“发送定向消息”“发送只投在线消息”等。

相关入口：

- [消息主区域](./src/views/Chat/components/Message/index.vue)
- [消息输入栏](./src/views/Chat/components/Message/components/ChatInputBox/index.vue)
- [文本消息](./src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue)
- [图片消息](./src/views/Chat/components/Message/components/ChatInputBox/components/ImageMessage/index.vue)
- [文件消息](./src/views/Chat/components/Message/components/ChatInputBox/components/FileMessage/index.vue)
- [视频消息](./src/views/Chat/components/Message/components/ChatInputBox/components/VideoMessage/index.vue)
- [语音消息](./src/views/Chat/components/Message/components/ChatInputBox/components/AudioMessage/index.vue)
- [透传消息](./src/views/Chat/components/Message/components/ChatInputBox/components/CmdMessage/index.vue)
- [扩展文本消息](./src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/SendExtMessage.vue)
- [自定义消息](./src/views/Chat/components/Message/components/ChatInputBox/components/CustomMessage/SendCustomMessage.vue)
- [个人名片](./src/views/Chat/components/Message/components/ChatInputBox/components/CustomMessage/ShareUserCard.vue)
- [定向消息](./src/views/Chat/components/Message/components/ChatInputBox/components/DirectedMessage/SendDirectedMessage.vue)

### 只投在线用户

消息输入栏提供“只投在线用户”全局开关。开启后，当前输入栏发出的消息会携带 `deliverOnlineOnly` 参数；关闭后按普通消息发送。

当前实现用于单聊/群聊消息发送链路，开关切换会展示 toast，并在控制台打印切换状态。消息发送仍以 SDK / 服务端真实结果为准，失败不做本地成功兜底。

相关入口：

- [只投在线参数工具](./src/utils/deliverOnlineOnly.js)
- [消息输入栏开关](./src/views/Chat/components/Message/components/ChatInputBox/index.vue)

### 服务端消息搜索

消息页头部提供“服务端消息搜索”入口，当前支持单聊、群聊、聊天室会话内搜索，也可以切换为搜索当前用户全部可见会话。

当前入口调用 SDK 5.0 `chatManager.searchMessages`，支持关键词、关键词关系、消息类型、搜索内容范围、可选日期时间范围、页码和每页条数。时间范围通过页面日期时间选择器选择；未选择时不传 `startTime` / `endTime`，选择后同时传入毫秒级开始和结束时间。

消息搜索是否可用以当前 SDK 5.0 / 服务端真实响应为准。Demo 按真实服务端结果展示：未开通时给出“服务端消息搜索功能未开通，请联系环信商务开通后再试”提示，同时在控制台保留完整错误、入参、当前用户和会话上下文；不做模拟结果、自动重试或本地成功兜底。

消息类型筛选只开放服务端支持的 `txt`、`img`、`video`、`loc`、`file`、`combine`。Demo 不在端上拦截关键词个数或关键词长度，超出服务端限制时按服务端返回的真实错误提示展示并保留 console 日志。

相关入口：

- [消息主区域搜索入口](./src/views/Chat/components/Message/index.vue)
- [服务端消息搜索抽屉](./src/views/Chat/components/Message/components/MessageSearchDrawer.vue)

### 展示与交互

- 展示文本、图片、文件、视频、语音、位置、自定义、透传、合并消息。
- 图片粘贴预览发送。
- 消息引用。
- 消息复制。
- 消息撤回。
- 文本消息编辑。
- 删除消息。
- 消息举报。
- 消息置顶和取消置顶。
- 单聊右侧资料面板：好友备注、消息免打扰、加入/移出黑名单、查看黑名单列表并移出用户、清空聊天记录、删除联系人。

相关入口：

- [消息列表项](./src/views/Chat/components/Message/components/ChatMessageListItem/index.vue)
- [消息引用](./src/views/Chat/components/Message/components/suit/msgQuote.vue)
- [图片预览发送](./src/views/Chat/components/Message/components/suit/previewSendImg.vue)
- [消息编辑](./src/views/Chat/components/Message/components/suit/modifyMessage.vue)
- [消息举报](./src/views/Chat/components/Message/components/suit/reportMessage.vue)
- [单聊详情](./src/views/Chat/components/Message/components/SingleChatDetails.vue)
- [消息状态](./src/store/modules/message.js)

### 消息状态与 Reaction

- 单聊消息送达回执状态展示。
- 单聊消息已读回执状态展示。
- 群聊文本消息发送时开启群消息已读回执统计。
- 群消息已读人数展示。
- 单聊/群聊消息添加 Reaction。
- 单聊/群聊消息取消 Reaction。
- 单聊/群聊消息查看 Reaction 详情。
- 聊天室当前不支持 Reaction，相关入口会保留真实限制提示。

相关入口：

- [消息状态](./src/store/modules/message.js)
- [消息列表项](./src/views/Chat/components/Message/components/ChatMessageListItem/index.vue)

### 消息撤回事件说明

本 Demo 用于验证真实 SDK / 服务端行为。撤回消息必须以 SDK 调用结果和 SDK 事件真实字段为准，不做客户端模拟成功或静默兜底。

- 发起撤回时通过 SDK 5.0 `chatManager.recallMessage` 传入真实消息 ID、目标 ID、会话类型。
- SDK 返回失败时保持失败提示和控制台错误，不把消息本地标记为已撤回。
- 接收撤回事件时优先使用 SDK 事件中的真实字段。
- 当前 Web SDK 的 `onRecallMessage` 回调体可能只有 `id`、`from`、`to`、`mid`、`ext` 等字段，未必包含 `chatType`。
- 跨端编辑/非聊天室撤回事件缺少 `chatType` 时，仅可使用本地已存在原消息的真实 `chatType` 更新。
- 聊天室撤回事件缺少 `chatType` 时，Demo 只输出包含 `messageId`、`from`、`to`、`localMessage`、`rawMessage` 的错误日志，不使用本地原消息补全为 `chatRoom` 后更新本地撤回状态，避免服务端未真实撤回时页面显示“已撤回”。
- 排查聊天室撤回问题时，建议同时保留 SDK 5.0 `chatManager.recallMessage` 入参、SDK Promise 成功或失败结果、`onRecallMessage` 原始回调、SDK 版本以及服务端对原消息 ID 的撤回状态确认。

## 群组能力

群组详情和管理能力：

- 展示群名称、群描述、群头像、群扩展、群公告、成员数量等信息。
- 修改群名称、群描述、群头像、群扩展信息。
- 查看和修改群公告。
- 查看、上传、下载、删除群共享文件。
- 查看群成员列表，邀请好友入群，移出群成员。
- 开启/关闭群组消息免打扰。
- 查看群黑名单，添加/移出黑名单。
- 查看群禁言名单，禁言/解除禁言群成员。
- 退出群组，解散群组。
- 群组系统通知基于 SDK 真实事件字段展示成员/操作者，缺失时不显示 `undefined`。

相关入口：

- [群组详情](./src/views/Chat/components/AboutGroups/GroupsDetails/index.vue)
- [群组管理](./src/views/Chat/components/AboutGroups/GroupsManagement/index.vue)
- [群组监听](./src/IM/listener/imGroupListener.js)
- [群组状态](./src/store/modules/groups.js)

## 群组子区 / 消息话题

群聊消息支持右键创建消息话题，也支持查看并进入群组子区会话。

当前能力：

- 群聊消息右键创建消息话题。
- 查看群组子区列表。
- 查看我加入的消息话题列表。
- 进入消息话题会话。
- 消息话题会话内返回父群组。
- 消息话题会话内发送、接收、撤回、获取历史消息。
- 批量获取消息话题最新消息。
- 加入、退出、改名、解散消息话题。
- 查看消息话题详情和成员列表。
- 移出消息话题成员。
- 监听消息话题事件。

相关入口：

- [消息话题抽屉](./src/views/Chat/components/Message/components/MessageThreadListDrawer.vue)
- [消息状态](./src/store/modules/message.js)
- [消息话题工具](./src/utils/messageThread.js)

## 聊天室能力

### 聊天室列表和成员关系

- 展示所有聊天室列表。
- 展示已加入聊天室列表。
- 刷新聊天室列表。
- 加入聊天室。
- 加入请求进行中阻止同一聊天室重复提交，成功或失败仍以真实 SDK / 服务端返回为准。
- 退出聊天室。
- 从聊天室详情进入消息页。

### 聊天室详情

- 展示聊天室基础信息。
- 重复进入详情时重新请求服务端详情。
- 展示聊天室公告。
- 设置聊天室消息免打扰。
- 修改聊天室信息。
- 更新聊天室公告。
- 获取聊天室自定义属性。
- 添加单个自定义属性。
- 删除单个自定义属性。
- 批量添加自定义属性。
- 批量删除自定义属性。

### 聊天室消息

- 发送文本、图片、视频、文件、语音、位置、自定义、透传、扩展文本、合并消息。
- 发送定向文本消息。
- 分享个人名片。
- 文本消息复制、引用、撤回、编辑。
- 删除消息。

### 聊天室成员管理

- 进入聊天室成员管理页。
- 查看成员、黑名单、白名单、禁言列表、管理员列表。
- 添加/移出黑名单。
- 添加/移出白名单。
- 禁言/解除禁言指定成员。
- 全员禁言/取消全员禁言。
- 添加/移除管理员。
- 移出聊天室成员。

当前 Web SDK 未确认暴露聊天室转让接口，Demo 不生成聊天室转让入口，也不用 REST 或本地逻辑模拟该能力。

相关入口：

- [聊天室列表](./src/views/Chat/components/Chatroom/index.vue)
- [聊天室详情](./src/views/Chat/components/Chatroom/ChatroomDetails.vue)
- [聊天室成员管理](./src/views/Chat/components/Chatroom/ChatroomMemberManagement.vue)
- [聊天室事件工具](./src/utils/chatroomEvents.js)
- [聊天室成员缓存](./src/store/index.js)

## 环信 SDK 集成入口

SDK 初始化和事件监听是 IM 能力实现的基础：

- [SDK 配置](./src/IM/config/index.js)
- [SDK 初始化包装](./src/IM/miniCore/index.js)
- [SDK 导出入口](./src/IM/index.js)
- [SDK 常量](./src/IM/constant/)
- [SDK 事件监听](./src/IM/listener/)
- [应用挂载入口](./src/App.vue)

典型接入流程：

```javascript
import { initSDK, login, requireManager } from '@/IM';

initSDK();
await login({ userId: '', token: '' });
const chatManager = requireManager('chatManager');
```

## 日志与错误处理

本项目保留完整 console 错误输出，便于排查真实 SDK / 服务端能力：

- SDK 5.0 `ChatClient` 与 Manager 调用、响应、事件、失败与重连日志会输出关键上下文。
- 服务端能力失败时尽量包含消息 ID、目标 ID、会话类型、当前用户等信息。
- SDK 消息解析空引用异常会保留原始错误日志，并阻止开发态全屏错误覆盖层遮挡页面。
- IM 连接断开、发送超时等真实失败只打印到控制台，不用开发态全屏错误覆盖层替代业务错误反馈。

相关入口：

- [miniCore 包装](./src/IM/miniCore/index.js)
- [全局错误处理](./src/utils/globalErrorHandler.js)
- [SDK 错误提示处理](./src/utils/handleSomeData/handleSDKErrorNotifi.js)

## EaseCallKit 音视频示例

项目保留 EaseCallKit 组件，用于通过 IM 信令结合 Agora RTC SDK 验证单人音频、单人视频、多人视频通话示例。

相关入口：

- [EaseCallKit 组件](./src/components/EaseCallKit/)
- [邀请成员组件](./src/components/InviteCallMembers/)

使用时需要准备：

- 环信 AppKey，并完成 WebIM SDK 初始化。
- Agora AppId。
- 声网房间鉴权服务，用于获取频道 token 和 uid。

## 功能清单维护

[cases_list.md](./cases_list.md) 是当前 Demo 功能能力清单，应只记录 Demo 已实现能力，不记录仅存在于测试或外部计划中的能力。

当新增、删除或调整功能入口、能力范围、支持场景时，需要同步更新：

- [cases_list.md](./cases_list.md)
- [.codex/prompts/superpowers.md](./.codex/prompts/superpowers.md)
- [README.md](./README.md)
