const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) =>
  fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const userProfileStore = read('src/store/modules/usersProfile.js');
const personalSettingCard = read(
  'src/views/Chat/components/NavBar/components/PersonalsettingCard/index.vue',
);
const casesList = read('cases_list.md');
const superpowers = read('.codex/prompts/superpowers.md');
const coverage = read('docs/sdk5-api-coverage.md');
const uncovered = read('docs/sdk5-uncovered-capabilities.md');

assert.match(userProfileStore, /requireManager\('userInfoManager'\)/);
assert.match(
  userProfileStore,
  /export const USER_INFO_EVENT_HANDLER_ID = 'sdk5-user-info-profile-listener';/,
  'UserInfo listener id must be an explicit SDK 5.0 handler id constant.',
);
assert.match(
  userProfileStore,
  /export const USER_INFO_ATTRIBUTES = \[[\s\S]*'nickname'[\s\S]*'avatarUrl'[\s\S]*'mail'[\s\S]*'phone'[\s\S]*'gender'[\s\S]*'sign'[\s\S]*'birth'[\s\S]*'ext'[\s\S]*\];/,
  'The profile attribute list must use the SDK 5.0 UserInfoAttribute names.',
);
assert.match(
  userProfileStore,
  /registerUserInfoEventHandler\(\{ commit \}\) \{[\s\S]*const manager = userInfoManager\(\);[\s\S]*manager\.removeEventHandler\(USER_INFO_EVENT_HANDLER_ID\);[\s\S]*manager\.addEventHandler\(USER_INFO_EVENT_HANDLER_ID,\s*\{[\s\S]*onOwnInfoUpdated\(userInfo\)[\s\S]*onUserInfoUpdated\(userInfos\)/,
  'The store must register UserInfoManager events after removing the same handler id.',
);
assert.match(
  userProfileStore,
  /removeUserInfoEventHandler\(\) \{[\s\S]*userInfoManager\(\)\.removeEventHandler\(USER_INFO_EVENT_HANDLER_ID\);[\s\S]*\}/,
  'The store must expose a removeEventHandler action.',
);
assert.match(
  userProfileStore,
  /fetchUserInfoByAttribute: async \(\{ commit \}, \{ userIds, attributes \}\) => \{[\s\S]*userInfoManager\(\)\.getUserInfoByAttribute\(\{[\s\S]*userIds,[\s\S]*attributes,[\s\S]*\}\)/,
  'The store must call UserInfoManager.getUserInfoByAttribute with SDK 5.0 params.',
);
assert.match(
  userProfileStore,
  /subscribeUsersInfo: async \(\{ commit \}, \{ userIds \}\) => \{[\s\S]*userInfoManager\(\)\.subscribeUsersInfo\(\{ userIds \}\)/,
  'The store must call UserInfoManager.subscribeUsersInfo with { userIds }.',
);
assert.match(
  userProfileStore,
  /unsubscribeUsersInfo: async \(\{ commit \}, \{ userIds \}\) => \{[\s\S]*userInfoManager\(\)\.unsubscribeUsersInfo\(\{ userIds \}\)/,
  'The store must call UserInfoManager.unsubscribeUsersInfo with { userIds }.',
);
assert.match(
  userProfileStore,
  /fetchSubscribedUsersInfo: async \(\{ commit \}\) => \{[\s\S]*userInfoManager\(\)\.getSubscribedUsers\(\)/,
  'The store must call UserInfoManager.getSubscribedUsers with no params.',
);
assert.match(
  userProfileStore,
  /updateOwnInfoByAttribute: async \(\{ commit \}, \{ attribute, value \}\) => \{[\s\S]*userInfoManager\(\)\.updateOwnInfoByAttribute\(\s*attribute,\s*value,\s*\)/,
  'The store must call UserInfoManager.updateOwnInfoByAttribute(attribute, value).',
);
assert.doesNotMatch(
  userProfileStore,
  /(?:EMClient|conn\.|sdk4|v4|4\.24\.1|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:|fallback|adapter|兼容|兜底)/i,
  'User profile extended capability must not introduce SDK 4.0 fields, adapters, or fallback paths.',
);

assert.match(personalSettingCard, /用户资料扩展能力/);
assert.match(personalSettingCard, /USER_INFO_ATTRIBUTES/);
assert.match(personalSettingCard, /store\.dispatch\('UsersProfile\/registerUserInfoEventHandler'\)/);
assert.match(personalSettingCard, /store\.dispatch\('UsersProfile\/removeUserInfoEventHandler'\)/);
assert.match(
  personalSettingCard,
  /store\.dispatch\('UsersProfile\/fetchUserInfoByAttribute', \{[\s\S]*userIds:[\s\S]*attributes:/,
);
assert.match(
  personalSettingCard,
  /store\.dispatch\('UsersProfile\/subscribeUsersInfo', \{[\s\S]*userIds: userInfoSubscriptionUserIds\.value,[\s\S]*\}\)/,
);
assert.match(
  personalSettingCard,
  /store\.dispatch\('UsersProfile\/unsubscribeUsersInfo', \{[\s\S]*userIds: userInfoSubscriptionUserIds\.value,[\s\S]*\}\)/,
);
assert.match(personalSettingCard, /store\.dispatch\('UsersProfile\/fetchSubscribedUsersInfo'\)/);
assert.match(
  personalSettingCard,
  /store\.dispatch\('UsersProfile\/updateOwnInfoByAttribute', \{[\s\S]*attribute: userInfoUpdateAttribute\.value,[\s\S]*value: normalizedUserInfoAttributeValue\.value/,
);
assert.match(personalSettingCard, /userInfoOperationError/);
assert.match(personalSettingCard, /rawUserInfoResult/);
assert.match(personalSettingCard, /属性名使用 SDK 5\.0 `UserInfoAttribute`/);
assert.doesNotMatch(
  personalSettingCard,
  /(?:EMClient|conn\.|sdk4|v4|4\.24\.1|\bchatType\b|\bmid\b|\bmsg\b|\bto\s*:|\bfrom\s*:|fallback|adapter|兼容|兜底)/i,
  'Personal setting user-info entry must not introduce SDK 4.0 fields, adapters, or fallback paths.',
);

assert.match(
  casesList,
  /用户资料扩展能力：注册 \/ 移除用户资料事件监听、按属性查询用户资料、订阅 \/ 取消订阅陌生人资料变更、查询已订阅用户、按单属性更新当前用户资料；均调用 SDK 5\.0 `UserInfoManager` 公开 API 并展示真实结果 \/ 错误/,
);
assert.match(
  superpowers,
  /用户资料扩展能力必须只调用 SDK 5\.0 `UserInfoManager\.addEventHandler\(handlerId, handlers\)`、`removeEventHandler\(handlerId\)`、`getUserInfoByAttribute\(\{ userIds, attributes \}\)`、`subscribeUsersInfo\(\{ userIds \}\)`、`unsubscribeUsersInfo\(\{ userIds \}\)`、`getSubscribedUsers\(\)`、`updateOwnInfoByAttribute\(attribute, value\)`/,
);
assert.match(coverage, /\| API 覆盖率 \| 94\.1% \|/);
assert.match(coverage, /\| 已覆盖公开对外 API \| 193 \|/);
assert.match(coverage, /\| 未覆盖公开对外 API \| 12 \|/);
assert.match(
  coverage,
  /\| 用户资料扩展能力 \| `UserInfoManager\.addEventHandler`, `removeEventHandler`, `getUserInfoByAttribute`, `subscribeUsersInfo`, `unsubscribeUsersInfo`, `getSubscribedUsers`, `updateOwnInfoByAttribute` \| 是 \| 个人设置页注册并移除用户资料事件监听；提供按 SDK 5\.0 `UserInfoAttribute` 属性查询资料、订阅 \/ 取消订阅用户资料变更、查询已订阅用户、按单属性更新当前用户资料入口，并展示 SDK 真实返回与事件日志。 \| 真实订阅通知、字段返回和服务端错误以 SDK \/ 服务端结果为准；不做本地回填或旧字段映射。 \|/,
);
assert.doesNotMatch(uncovered, /用户资料订阅与按属性查询 \/ 更新/);
assert.match(
  uncovered,
  /当前 `src\/` 覆盖 193 个，未覆盖 12 个；`@internal` 私有方法已剔除/,
);

console.log('sdk5 user info extended contract: PASS');
