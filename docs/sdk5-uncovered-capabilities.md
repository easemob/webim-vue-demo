# SDK 5.0 已支持但 Demo 尚未覆盖的能力

本文件与 [`sdk5-unsupported-capabilities.md`](./sdk5-unsupported-capabilities.md) 分开维护：这里只记录当前本地 `easemob-websdk 5.0.1` 已公开、可由 SDK 5.0 真实调用，但尚未在页面实现且未写入 `cases_list.md` 的用户可见能力。

判定规则：必须同时满足 SDK 5.0 源码存在公开 Manager API、迁移指南列有对应能力、当前 `src/` 没有真实页面调用且 `cases_list.md` 没有相应条目。后续实现后，应从本文件移除并同步写入 `cases_list.md` 和 `.codex/prompts/superpowers.md`；不得以 mock、REST 兜底或本地伪状态替代 SDK 调用。

| 能力 | SDK 5.0 公开 API | 当前缺口证据 | 状态 |
| --- | --- | --- | --- |
| 全局消息免打扰 | `pushManager.setGlobalSilentMode` / `pushManager.getGlobalSilentMode` | `cases_list.md` 仅记录单个会话免打扰；当前 `src/` 无全局免打扰页面调用 | 待实现 |
| 推送语言设置与查询 | `pushManager.setPushLanguage` / `pushManager.getPushLanguage` | 当前设置页和 `cases_list.md` 未提供推送语言入口 | 待实现 |
| 批量读取会话免打扰设置 | `pushManager.getConversationSilentModes` | 当前仅有单会话设置入口，未提供会话免打扰配置的批量读取与展示 | 待实现 |

> 这是基于迁移指南和 SDK 源码完成的首轮缺口记录，不代表服务端环境已实际开通。每个实现仍须以真实 SDK / 服务端响应验收；失败必须直接暴露。
