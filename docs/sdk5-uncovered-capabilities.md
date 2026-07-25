# SDK 5.0 已支持但 Demo 尚未覆盖的能力

本文件与 [`sdk5-unsupported-capabilities.md`](./sdk5-unsupported-capabilities.md) 分开维护：这里只记录当前本地 `easemob-websdk 5.0` 已公开、可由 SDK 5.0 真实调用，但尚未在页面实现且未写入 `cases_list.md` 的用户可见能力。

判定规则：必须同时满足 SDK 5.0 类型声明存在公开对外 API、迁移指南列有对应能力、当前 `src/` 没有真实页面调用且 `cases_list.md` 没有相应条目。后续实现后，应从本文件移除并同步写入 `cases_list.md` 和 `.codex/prompts/superpowers.md`；不得以 mock、REST 兜底或本地伪状态替代 SDK 调用。

API 级完整覆盖矩阵见 [`sdk5-api-coverage.md`](./sdk5-api-coverage.md)。该矩阵按当前 `easemob-websdk 5.0` 类型声明统计公开对外 API，并标注当前 Demo 已覆盖、部分覆盖和未覆盖内容；`@internal` 私有方法已按研发反馈剔除，不计入分母也不登记为未覆盖能力。

| 能力 | SDK 5.0 公开 API | 当前缺口证据 | 状态 |
| --- | --- | --- | --- |
| API 级完整覆盖矩阵中标记为“否”或“部分覆盖”的公开对外能力 | 见 [`sdk5-api-coverage.md`](./sdk5-api-coverage.md) | 2026-07-25 由 `node scripts/sdk5-api-coverage.cjs` 静态复核：当前 SDK 5.0 公开对外 API 205 个，当前 `src/` 覆盖 193 个，未覆盖 12 个；`@internal` 私有方法已剔除。`ChatManager.voiceFileToText`、`ChatClient.getUserIdsWithRTCUids`、`ChatClient.getSelfIdsOnOtherPlatform` 已在个人设置以原始 SDK 调用接入。保留明确缺口为 `GroupManager.getGroupInfo`、`getGroupInfoList` 直调路径；现有页面保持 `Group` facade 单路径。 | 待按功能优先级实现 |

> 这是基于迁移指南和 SDK 源码完成的首轮缺口记录，不代表服务端环境已实际开通。每个实现仍须以真实 SDK / 服务端响应验收；失败必须直接暴露。
