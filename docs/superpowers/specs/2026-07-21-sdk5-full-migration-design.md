# SDK 5.0 全量迁移设计

## 目标

将 WebIM Vue Demo 的 `feature/qa-webimim5.0-demo` 分支从 Web SDK v4 完整迁移至 `/Users/admin/easemob/easemob-web/demo/demo/websdk2` 当前源码重新构建的 SDK 5.0 本地包，并保留当前页面可见的全部功能。

## 迁移宪法

1. **SDK 5.0 是唯一事实源。** Demo 只能依赖由 `websdk2` 当前源码构建并打包的本地 `easemob-websdk`。禁止保留远程或本地 v4 包、v4 补丁、旧接口和兼容层。
2. **全功能真实覆盖。** 以 `cases_list.md` 的当前 Demo 功能为验收基线，逐项映射 SDK 5.0 的公开 API、事件与真实返回；不得因迁移静默下线页面能力。
3. **真实结果优先。** 只展示 SDK 和服务端真实成功、失败与事件。失败保留完整控制台上下文并提供正常页面反馈；禁止 mock、自动重试、REST 替代 SDK 成功、缓存补齐、乐观成功或静默降级。
4. **只使用 SDK 5.0 原生模型。** 初始化使用 `ChatClient.init` 和明确注册的 Manager；登录使用 Token；消息使用 `conversationId`、`conversationType`、`chatManager.createXxxMessage` 与 `sendMessage`；接收使用统一 `onMessage`。
5. **能力缺口如实暴露。** 当前 SDK 5.0 构建包没有公开 API 的能力必须显示为 SDK 5.0 当前不支持，并输出 API/错误上下文；不得回退旧 SDK、REST 或 mock。
6. **依赖和产物卫生。** 删除 `dist/`、v4 补丁、v4 依赖及所有 `EMClient`、`conn`、`WebIM.message.create` 和旧事件模型引用。构建产物不纳入版本控制。
7. **验证不夸大。** 每个迁移模块须进行静态映射检查与构建验证；具备环境配置时执行真实环境验证。缺少环境或服务端失败必须标记为未验证/失败，不能计为通过。
8. **文档同步。** 每一项能力变更同步更新 `cases_list.md`、`.codex/prompts/superpowers.md`、README 和覆盖矩阵；这些文档只描述当前页面真实可触达的功能。
9. **能力缺口留档。** 每个 SDK 5.0 未公开的当前 Demo 能力必须记录到 `docs/sdk5-unsupported-capabilities.md`，包含旧入口、公开 API 核验、页面真实行为和验证状态。
10. **全参数契约校验。** 每一个 SDK 调用均须以当前安装包的公开类型声明和方法签名作为唯一契约，一次性核对全部输入字段、必填性、类型与返回字段；禁止根据单个服务端报错只修一个参数，禁止遗留旧 SDK 字段、同义映射或兼容参数。每次对齐必须新增覆盖完整契约的定向回归测试。

## 架构

保留 Vue 3、Vuex 和当前页面/交互结构。新增一个集中式 SDK 5.0 适配边界：初始化、登录、Manager 调用、参数转换、事件归一化和错误记录均在 `src/IM/` 中完成；业务组件和 store 只调用该边界，不直接兼容旧 SDK 对象。

SDK 5.0 本地包从 `websdk2` 构建后使用 tarball 安装。迁移不读取 `websdk2` 的内部源码实现，所有调用都以打包产物的公开导出和类型定义为准。

## 能力覆盖矩阵

| 当前 Demo 域 | SDK 5.0 目标 Manager | 必须迁移的真实能力 |
| --- | --- | --- |
| 初始化、鉴权、连接、日志 | `ChatClient` | 初始化、Token 登录/登出、连接事件、Token 刷新、SDK 日志 |
| 消息与历史记录 | `chatManager` | 全消息类型、附件上传、发送状态、历史、撤回、编辑、删除、引用、合并、定向、只投在线、回执、置顶、举报、搜索、翻译 |
| 会话 | `chatManager` 或 SDK 5.0 对应公开 Manager | 列表、搜索、置顶、标星、未读、推送设置、删除 |
| 联系人和资料 | `contactManager`、`userInfoManager` | 好友、黑名单、备注、资料、系统通知 |
| 群组和子区 | `groupManager`、`chatThreadManager` | 群组管理、成员/禁言/黑白名单、公告、属性、共享文件、Thread 全链路 |
| 聊天室 | `chatRoomManager` | 列表、加入退出、详情、公告、属性、成员/禁言/黑白名单、聊天室消息 |
| 在线状态与推送 | `presenceManager`、`pushManager` | 发布/订阅在线状态、会话/全局免打扰 |
| Reaction 和多设备 | SDK 5.0 对应公开 Manager/事件 | Reaction 增删查、跨设备真实事件 |
| 音视频 | 现有 Agora SDK | 保持独立于 IM SDK 迁移，仍以真实 RTC 结果为准 |

## 迁移完成判据

- `package.json`、锁文件、源码、测试、文档与构建产物中不再含 v4.24.1、旧 SDK patch、`EMClient`、`conn` 或 `WebIM.message.create` 的运行时依赖。
- 每个 `cases_list.md` 功能都有 SDK 5.0 API/事件映射及验证状态。
- 构建通过；真实环境可用时按模块记录真实验证结果。
- SDK 5.0 实际未提供的能力不伪造成功，并在功能清单中如实标注。

## 测试策略

- 静态迁移检查：检测 v4 依赖、旧 SDK 标识和旧事件回调残留。
- 适配层测试：覆盖 SDK 5.0 参数转换、成功、失败和事件路由；测试 mock 只用于验证适配代码，不得改变 Demo 运行时行为。
- 构建验证：执行 Vue production build。
- 真实环境验证：配置真实 appKey、用户和 Token 后验证登录、消息、会话、联系人、群组、聊天室、在线状态和推送；缺少条件时标记未验证。
