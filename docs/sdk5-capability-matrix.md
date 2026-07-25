# SDK 5.0 真实能力验证矩阵

本矩阵记录当前 Demo 的 WebSDK 5.0 能力验证状态。`真实通过` 必须有实际 SDK/服务端会话证据；源码检查、安装校验和单元契约测试只能证明适配，不替代真实结果。历史页面实测证据只说明当时的真实执行结果；未在当前环境重新页面实测的能力必须标为待复测。失败或未验证时禁止 mock、REST、旧 SDK 或本地伪成功。

| 模块 / Case | SDK 5.0 真实 API | 结果 | 2026-07-22 历史实测证据 | 风险 / 后续动作 |
| --- | --- | --- | --- | --- |
| Token 登录与 NGI DNS | `ChatClient.login({ userId, token })` | 历史真实通过；当前环境待页面复测 | 真实 NGI Token 登录后进入会话页 | Token 不写入源码、文档或日志；真实登录结果需重新页面验证 |
| 会话列表读取 | `chatManager` 的会话同步能力 | 真实通过 | 登录后页面显示现有单聊和群聊会话 | 仅验证读取，不以此证明消息写入能力 |
| 好友列表刷新 | `contactManager` | 真实通过 | 页面真实返回好友 `tst09` | 写操作另行以独立资源验证 |
| 公开聊天室列表 | `chatRoomManager.getChatRoomList` | 真实通过 | 页面实际返回 50 个聊天室及加入入口 | SDK 5.0 列表不含当前用户成员关系；不得据此伪造“已加入”列表 |
| 加入聊天室后操作状态 | `chatRoomManager.joinChatRoom` | 真实通过 | 账号 `tst08` 成功加入公开房间 `319970921742338`；切到会话 Tab 再回聊天室列表，该房间显示“进入聊天室”且不显示“加入”；点击后仅进入消息页 | 成功结果保存在应用级内存，切换主导航保留，退出登录/真实退出成功时清空；不批量请求详情推测全量成员关系 |
| 聊天室加入失败可见性 | `chatRoomManager.joinChatRoom` | 真实失败 | 对公开房间 `308632428281858`，SDK 返回 `MessageSendError: Message send failed`；页面保留“加入”并输出完整错误 | 不重试、不用 REST 或本地状态伪造“已加入” |
| 已加入群组摘要读取与展示 | `groupManager.getJoinedGroupList`、`groupManager.getGroup(groupId).getDetail()` / `refresh()` | 真实通过 | 真实群组显示 `group3（2）`；此前 `undefined` 已消失 | 直接读取 SDK 5.0 `name`、`memberCount`、`avatarUrl`、`maxMembers`，不转换为旧字段 |
| 群聊消息页标题 | 已加入群组摘要 | 真实通过 | 从群组进入聊天页后标题显示 `group3 (2)` | 群组详情内写操作未执行 |
| 会话本地搜索 | 本地 SDK 会话数据 | 真实通过 | 搜索 `group3` 后页面真实返回群组会话建议，未复现缺失 `msg` 的 `indexOf` 页面异常 | 非文本消息按 SDK 原始字段搜索；不编造消息文本 |
| 服务端消息搜索 | `chatManager.searchMessages` | 真实通过 | 在真实群聊中搜索关键词“安全”，页面收到 SDK 查询完成结果并真实展示空结果 | 空结果不等于消息能力全链路已验证；其他关键词、范围和消息类型待独立覆盖 |
| SDK 5.0 消息回包与历史消息 | `chatManager.sendMessage` / `getHistoryMessages` | 真实通过 | SDK 5.0 返回 `conversationId`、`conversationType`、`sender`、`timestamp`、`body`；Demo Store/UI 直接消费原始字段。单聊、群聊、聊天室均能在重进会话后读取已发送消息 | 不猜测或补齐缺失字段；服务端实际未下发字段仍保留原始错误 |
| 单聊文本消息 | `createTextMessage` / `sendMessage` | 真实通过 | 向好友 `tst09` 真实发送，服务端 ACK 后页面显示测试文本 | 已在会话重进后读取验证 |
| 群聊文本消息 | `createTextMessage` / `sendMessage` | 真实通过 | 向真实群组 `group3` 发送，页面显示测试文本 | 已在真实已加入群组验证 |
| 聊天室文本消息 | `createTextMessage` / `sendMessage` | 真实通过 | 加入真实公开聊天室后发送，页面显示测试文本且收到消息事件 | 聊天室加入是本次消息验证的必要真实副作用 |
| 单聊自定义消息 | `createCustomMessage` / `sendMessage` | 真实通过 | 向 `tst09` 真实发送，页面显示自定义 `event` | 已验证 SDK 5.0 `event` / `ext` 形状 |
| 群聊自定义消息 | `createCustomMessage` / `sendMessage` | 真实通过 | 向 `group3` 真实发送，页面显示自定义 `event` | 同一真实群组资源 |
| 聊天室自定义消息 | `createCustomMessage` / `sendMessage` | 真实通过 | 向已加入聊天室真实发送，页面显示自定义 `event` | 同一真实聊天室资源 |
| 单聊透传消息 | `createCmdMessage` / `sendMessage` | 真实通过 | 向 `tst09` 真实发送，页面显示 `action` 与扩展信息 | 已修复旧日志变量导致的页面运行时错误 |
| 单聊扩展文本消息 | `createTextMessage` / `sendMessage` | 真实通过 | 向 `tst09` 真实发送文本及 `ext`，页面显示扩展信息 | 扩展内容以服务端回包为准 |
| 单聊位置消息 | `createLocationMessage` / `sendMessage` | 真实通过 | 向 `tst09` 真实发送，页面显示“四通桥东、纬度 39、经度 116” | 使用页面内既有位置参数 |
| 单聊合并消息 | `createCombineMessage` / `sendMessage` | 真实通过 | 首次真实失败暴露 SDK 5.0 嵌套消息必填结构；修复为 `sender/conversationId/conversationType/timestamp/body` 后真实上传并发送成功 | 群聊、聊天室合并消息未验证 |
| 解散聊天室、创建聊天室、已加入聊天室列表、聊天室消息免打扰、举报消息、下载 SDK 日志、屏蔽群消息 | 无对应公开 API | SDK 未支持 | 见 [sdk5-unsupported-capabilities.md](./sdk5-unsupported-capabilities.md) | 聊天室成员禁言 API 不等同于当前用户的消息免打扰；页面不得保留误导性开关或兜底 |
| Push 扩展能力 | `pushManager.uploadPushToken`、`setGlobalSilentMode` / `getGlobalSilentMode`、`getConversationSilentModes`、`setPushLanguage` / `getPushLanguage`、`getConversationListByRemindType` | 未验证 | 个人设置页已提供 SDK 5.0 真实调用入口，静态覆盖已登记 | 必须输入真实 Push Token / 会话参数后验证；失败按 SDK / 服务端真实错误展示 |

## 消息类型真实验证矩阵

状态只记录本轮真实页面发送结果；`未验证` 表示当前没有真实 PASS 或 FAIL，不能依据源码、契约测试或其他会话类型推断通过。

| 消息类型 | 单聊 | 群聊 | 聊天室 | 备注 |
| --- | --- | --- | --- | --- |
| 文本 | 真实通过 | 真实通过 | 真实通过 | 三种会话均确认服务端 ACK 后页面显示 |
| 自定义 | 真实通过 | 真实通过 | 真实通过 | 确认 SDK 5.0 `event` 和扩展字段展示 |
| 透传 / cmd | 真实通过 | 未验证 | 未验证 | 单聊确认 `action` 与扩展信息展示 |
| 扩展文本 | 真实通过 | 未验证 | 未验证 | 单聊确认文本和 `ext` 展示 |
| 位置 | 真实通过 | 未验证 | 未验证 | 单聊显示真实位置名称及经纬度 |
| 合并 | 真实通过 | 未验证 | 未验证 | 已按 SDK 5.0 嵌套 `messageList` 契约修复并真实重测 |
| 图片 | 未验证 | 未验证 | 未验证 | 真实页面点击后未触发预置图片发送或文件选择事件；无服务端请求/错误，不能判定 SDK 成功或失败 |
| 文件 | 未验证 | 未验证 | 未验证 | 本轮未获得实际上传请求结果 |
| 视频 | 未验证 | 未验证 | 未验证 | 本轮未获得实际上传请求结果 |
| 语音 | 未验证 | 未验证 | 未验证 | 需要真实录音采集或页面选择的音频文件 |
| 名片 | 未验证 | 未验证 | 未验证 | 页面入口存在；本轮未发送 |
| 定向文本 | 未验证 | 未验证 | 未验证 | 仅页面实际暴露的会话类型可验证 |

本轮使用的真实资源为好友 `tst09`、已加入群组 `group3` 和加入的公开聊天室；测试标记消息保留在服务端，便于后续检索和回收。

## 当前结论

- 已经真实通过的仅是表中明确标为“真实通过”的读取/登录链路。
- 未经独立真实请求验证的写操作、未列出的消息类型、回执、Reaction、话题、群组/聊天室成员管理都不得标为通过。
- SDK 5.0 未支持能力和 Demo 未覆盖能力分别维护在对应记录文件，避免将“没有入口”误报为服务端成功或失败。
