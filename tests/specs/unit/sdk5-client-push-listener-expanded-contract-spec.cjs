const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const storeIndex = read('src/store/index.js');
const sdkDiagnosticsStore = read('src/store/modules/sdkDiagnostics.js');
const personalSettingCard = read(
  'src/views/Chat/components/NavBar/components/PersonalsettingCard/index.vue',
);
const connectListener = read('src/IM/listener/imConnectListener.js');
const contactListener = read('src/IM/listener/imContactListener.js');
const groupListener = read('src/IM/listener/imGroupListener.js');
const presenceListener = read('src/IM/listener/imPresenceListener.js');
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

assert.match(storeIndex, /import SdkDiagnostics from '\.\/modules\/sdkDiagnostics';/);
assert.match(storeIndex, /SdkDiagnostics,/);

const listenerContracts = [
  {
    source: connectListener,
    manager: 'getClient\\(\\)',
    constant: 'CHAT_CLIENT_EVENT_HANDLER_ID',
    id: 'connection',
    addCall: 'addEventHandler',
    removeCall: 'removeEventHandler',
  },
  {
    source: contactListener,
    manager: "requireManager\\('contactManager'\\)",
    constant: 'CONTACT_EVENT_HANDLER_ID',
    id: 'friendListen',
    addCall: 'addEventHandler',
    removeCall: 'removeEventHandler',
  },
  {
    source: groupListener,
    manager: "requireManager\\('groupManager'\\)",
    constant: 'GROUP_EVENT_HANDLER_ID',
    id: 'groupEvent',
    addCall: 'addEventHandler',
    removeCall: 'removeEventHandler',
  },
  {
    source: presenceListener,
    manager: "requireManager\\('presenceManager'\\)",
    constant: 'PRESENCE_EVENT_HANDLER_ID',
    id: 'presenceStatusChange',
    addCall: 'addEventHandler',
    removeCall: 'removeEventHandler',
  },
];

for (const contract of listenerContracts) {
  assert.match(
    contract.source,
    new RegExp(`const ${contract.constant} = '${contract.id}';`),
    `${contract.constant} must be an explicit SDK 5.0 handler id constant.`,
  );
  assert.match(
    contract.source,
    new RegExp(
      `const manager = ${contract.manager};[\\s\\S]*manager\\.${contract.removeCall}\\(${contract.constant}\\);[\\s\\S]*manager\\.${contract.addCall}\\(\\s*${contract.constant}\\s*,`,
    ),
    `${contract.constant} must remove the same handler id before adding it.`,
  );
  assert.doesNotMatch(
    contract.source,
    /(?:EMClient|conn\.|onChatEvent|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:|sdk4|v4|4\.24\.1|adapter|兼容|兜底)/i,
    `${contract.constant} must not restore SDK 4.0 listener paths or fields.`,
  );
}

assert.match(sdkDiagnosticsStore, /namespaced:\s*true/);
assert.match(sdkDiagnosticsStore, /const client = getClient\(\);/);
assert.match(sdkDiagnosticsStore, /client\.getConnectionState\(\)/);
assert.match(sdkDiagnosticsStore, /client\.getRestContext\(\)/);
assert.match(sdkDiagnosticsStore, /client\.getCacheManager\(\)/);
assert.match(sdkDiagnosticsStore, /client\.getUploadAdapter\(\)/);
assert.match(sdkDiagnosticsStore, /client\.getContactSnapshot\(\)/);
assert.match(sdkDiagnosticsStore, /client\.renewToken\(token\)/);
assert.match(sdkDiagnosticsStore, /pushManager\(\)\.uploadPushToken\(\{[\s\S]*deviceId,[\s\S]*deviceToken,[\s\S]*notifierName,[\s\S]*\}\)/);
assert.match(sdkDiagnosticsStore, /pushManager\(\)\.setGlobalSilentMode\(\{ rule \}\)/);
assert.match(sdkDiagnosticsStore, /pushManager\(\)\.getGlobalSilentMode\(\)/);
assert.match(sdkDiagnosticsStore, /pushManager\(\)\.getConversationSilentModes\(\{ conversationList \}\)/);
assert.match(sdkDiagnosticsStore, /pushManager\(\)\.setPushLanguage\(\{ language \}\)/);
assert.match(sdkDiagnosticsStore, /pushManager\(\)\.getPushLanguage\(\)/);
assert.match(sdkDiagnosticsStore, /pushManager\(\)\.getConversationListByRemindType\(\{[\s\S]*pageSize,[\s\S]*cursor,[\s\S]*\}\)/);
  assert.doesNotMatch(
    sdkDiagnosticsStore,
  /(?:EMClient|conn\.|sdk4|v4|4\.24\.1|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:|fallback|兼容|兜底)/i,
  'Diagnostics store must use SDK 5.0 APIs directly without old fields or fallback paths.',
);

assert.match(personalSettingCard, /ChatClient 运行诊断/);
assert.match(personalSettingCard, /store\.dispatch\('SdkDiagnostics\/readChatClientRuntimeSnapshot'\)/);
assert.match(personalSettingCard, /store\.dispatch\('SdkDiagnostics\/renewChatClientToken'/);
assert.match(personalSettingCard, /Push 扩展能力/);
assert.match(personalSettingCard, /store\.dispatch\('SdkDiagnostics\/uploadPushToken'/);
assert.match(personalSettingCard, /store\.dispatch\('SdkDiagnostics\/setGlobalSilentMode'/);
assert.match(personalSettingCard, /store\.dispatch\('SdkDiagnostics\/getGlobalSilentMode'\)/);
assert.match(personalSettingCard, /store\.dispatch\('SdkDiagnostics\/getConversationSilentModes'/);
assert.match(personalSettingCard, /store\.dispatch\('SdkDiagnostics\/setPushLanguage'/);
assert.match(personalSettingCard, /store\.dispatch\('SdkDiagnostics\/getPushLanguage'\)/);
assert.match(personalSettingCard, /store\.dispatch\('SdkDiagnostics\/getConversationListByRemindType'/);
assert.match(personalSettingCard, /token 明文不写入日志/);
  assert.doesNotMatch(
    personalSettingCard,
  /(?:EMClient|conn\.|sdk4|v4|4\.24\.1|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:|fallback|兼容|兜底)/i,
  'Personal setting diagnostics entry must not introduce SDK 4.0 fields, adapters, or fallback paths.',
);

assert.match(
  casesList,
  /ChatClient 运行诊断：读取 SDK 5\.0 `getConnectionState\(\)`、`getRestContext\(\)`、`getCacheManager\(\)`、`getUploadAdapter\(\)`、`getContactSnapshot\(\)` 的真实返回/,
);
assert.match(
  casesList,
  /Token 续期：用户输入新 Token 后调用 SDK 5\.0 `renewToken\(token\)`；token 明文不写入日志/,
);
assert.match(
  casesList,
  /Push 扩展能力：上传 Push Token、设置 \/ 查询全局免打扰、批量查询会话免打扰、设置 \/ 查询推送语言、按提醒类型分页查询会话/,
);
assert.match(
  casesList,
  /联系人事件监听生命周期（注册 SDK 5\.0 `ContactManager\.addEventHandler` 前先调用 `removeEventHandler` 清理同 ID 监听）/,
);
assert.match(
  casesList,
  /在线状态事件监听生命周期（注册 SDK 5\.0 `PresenceManager\.addEventHandler` 前先调用 `removeEventHandler` 清理同 ID 监听）/,
);
assert.match(
  casesList,
  /群组事件监听生命周期（注册 SDK 5\.0 `GroupManager\.addEventHandler` 前先调用 `removeEventHandler` 清理同 ID 监听）/,
);
assert.match(
  superpowers,
  /ChatClient 诊断能力必须只调用 SDK 5\.0 公开 `getConnectionState\(\)`、`getRestContext\(\)`、`renewToken\(token\)`、`getCacheManager\(\)`、`getUploadAdapter\(\)`、`getContactSnapshot\(\)`/,
);
assert.match(
  superpowers,
  /Push 扩展能力必须只调用 SDK 5\.0 公开 `uploadPushToken\(\{ deviceId, deviceToken, notifierName \}\)`、`setGlobalSilentMode\(\{ rule \}\)`、`getGlobalSilentMode\(\)`、`getConversationSilentModes\(\{ conversationList \}\)`、`setPushLanguage\(\{ language \}\)`、`getPushLanguage\(\)`、`getConversationListByRemindType\(\{ pageSize, cursor \}\)`/,
);
assert.match(
  superpowers,
  /ContactManager、PresenceManager、GroupManager 和 ChatClient 事件监听注册前必须先调用同一 handlerId 的 `removeEventHandler\(handlerId\)`/,
);

assert.match(coverage, /\| API 覆盖率 \| 93\.6% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 189 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 13 \|/);
assert.match(
  coverage,
  /\| 登录、退出和当前用户 \| `ChatClient\.login`, `ChatClient\.logout`, `ChatClient\.getCurrentUserId`, `ChatClient\.getServerUrlsConfig`, `ChatClient\.addEventHandler`, `ChatClient\.removeEventHandler` \| 是 \| Token 登录、退出登录、登录后初始化、当前用户读取、运行环境详情展示、连接事件监听与移除监听均已接入；连接监听注册前调用同 ID `removeEventHandler`。 \| 真实连接事件下发以 SDK 回调为准；不保留重复监听或旧事件兜底。 \|/,
);
assert.match(
  coverage,
  /\| 连接状态、Token 续期与上下文读取 \| `ChatClient\.getConnectionState`, `ChatClient\.getRestContext`, `ChatClient\.renewToken`, `ChatClient\.getCacheManager`, `ChatClient\.getUploadAdapter`, `ChatClient\.getContactSnapshot` \| 是 \| 个人设置页提供 ChatClient 运行诊断和 Token 续期入口；调用 SDK 5\.0 公开方法读取连接状态、REST 上下文、缓存管理器、上传适配器、联系人快照，并由用户输入新 Token 后调用 `renewToken\(token\)`。 \| `getRestContext\(\)` 和 `renewToken\(token\)` 涉及 token，页面 \/ 日志只展示脱敏摘要；SDK 失败按真实错误展示。 \|/,
);
assert.match(
  coverage,
  /\| 联系人事件监听 \| `ContactManager\.addEventHandler`, `removeEventHandler` \| 是 \| 已监听 SDK 5\.0 好友申请、好友添加、好友删除等命名联系人事件；注册前调用同 ID `removeEventHandler` 清理旧监听。 \| 真实事件下发以 SDK \/ 服务端回调为准；不从联系人快照补造事件。 \|/,
);
assert.match(
  coverage,
  /\| 在线状态 \| `PresenceManager\.addEventHandler`, `publishPresence`, `subscribePresence`, `unsubscribePresence`, `getSubscribedPresenceList`, `getPresenceStatus`, `removeEventHandler` \| 是 \| 发布在线状态、订阅 \/ 取消订阅好友在线状态、查询订阅列表、查询在线状态、监听 Presence 变更和移除监听均已接入；注册前调用同 ID `removeEventHandler` 清理旧监听。 \| 真实 Presence 事件和查询结果以 SDK \/ 服务端返回为准。 \|/,
);
assert.match(
  coverage,
  /\| 推送扩展能力 \| `PushManager\.uploadPushToken`, `setGlobalSilentMode`, `getGlobalSilentMode`, `getConversationSilentModes`, `setPushLanguage`, `getPushLanguage`, `getConversationListByRemindType` \| 是 \| 个人设置页提供上传 Push Token、设置 \/ 查询全局免打扰、批量查询会话免打扰、设置 \/ 查询推送语言、按提醒类型分页查询会话入口，均调用 SDK 5\.0 `PushManager` 公开 API 并展示真实返回 \/ 错误。 \| Push Token 由用户输入，不生成假 token；聊天室不传入批量会话免打扰查询。 \|/,
);
assert.match(
  coverage,
  /\| 群组事件监听 \| `GroupManager\.addEventHandler`, `removeEventHandler` \| 是 \| 已监听 SDK 5\.0 命名群组事件并刷新系统通知、群成员、群详情、公告、共享文件等；注册前调用同 ID `removeEventHandler` 清理旧监听。 \| 真实群组事件下发以 SDK \/ 服务端回调为准；通知层只承载 SDK 5\.0 原始事件名和 payload，不退回 V4 事件模型。 \|/,
);
assert.doesNotMatch(coverage, /未覆盖 `(?:ChatClient|ContactManager|PresenceManager|GroupManager)\.removeEventHandler`/);
assert.doesNotMatch(coverage, /推送：未覆盖推送 Token/);
assert.doesNotMatch(uncovered, /全局消息免打扰|推送语言设置与查询|批量读取会话免打扰设置|PushManager/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 189 个，未覆盖 13 个；`@internal` 私有方法已剔除/,
);

console.log('sdk5 client push listener expanded contract: PASS');
