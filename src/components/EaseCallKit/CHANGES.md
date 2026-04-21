# EaseCallKit 组件废弃与 SDK 化改造说明

## 一、改造背景

EaseCallKit 为项目早期内置的音视频通话组件，基于 Agora RTC SDK 实现了 1v1 语音/视频通话及多人通话功能。当前项目已接入 `easemob-chat-callkit-vue3` 作为新的音视频通话方案，EaseCallKit 不再引入使用。

本次改造遵循**保留代码、标记废弃、SDK 方法迁移**的原则，将 EaseCallKit 中依赖自建 HTTP 请求获取 RTC Token 和频道用户映射的逻辑，替换为环信 Web SDK 4.17.0+ 内置方法，消除对额外 AppServer 的依赖。

---

## 二、废弃标记

EaseCallKit 目录下**所有 16 个文件**均在文件首行添加了 `@deprecated` 标记：

- **`.vue` 文件**：`<!-- @deprecated EaseCallKit 已废弃，请使用 easemob-chat-callkit-vue3 替代。该组件不再维护，仅保留作参考。 -->`
- **`.js` 文件**：`/** @deprecated EaseCallKit 已废弃，请使用 easemob-chat-callkit-vue3 替代。该组件不再维护，仅保留作参考。 */`

涉及文件清单：

```
src/components/EaseCallKit/
├── index.vue
├── alertModal.vue
├── components/
│   ├── miniStreamContainer.vue
│   ├── multiCall.vue
│   └── singleCall.vue
├── config/
│   └── initAgoraRtc.js
├── constants/
│   ├── callKitEvent.js
│   ├── imClient.js
│   └── index.js
├── hooks/
│   ├── index.js
│   ├── useCallKitEvent.js
│   └── useManageChannel.js
└── utils/
    ├── callMessages.js
    ├── createUid.js
    ├── getChannelDetails.js    ← 已迁移，仅作转发
    └── getRtcToken.js           ← 核心改造文件
```

---

## 三、核心改造：HTTP 请求 → SDK 内置方法

### 3.1 `getRtcToken.js` — 频道 Token 获取

**改造前**：通过 `fetch` 向 AppServer 发起 HTTP 请求获取 RTC Token

```javascript
// 旧实现：手动 HTTP 请求
export default function (EaseIMConn, payload) {
  const { username, channelName } = payload;
  return new Promise(function (resolve, reject) {
    fetch(`${EaseIMConn.apiUrl}/token/rtcToken/v1?userAccount=${username}&channelName=${channelName}&appkey=...`, ...)
  });
}
```

**改造后**：使用 SDK 4.17.0+ 内置的 `getRTCToken` 方法

```javascript
// 新实现：SDK 内置方法
export async function requestRtcChannelToken(CallKitEMClient, channelName) {
  const res = await CallKitEMClient.getRTCToken(channelName);
  return res.data;
  // res.data = { appId: string, RTCUId: number, RTCToken: string }
}
```

| 对比项 | 改造前 | 改造后 |
|--------|--------|--------|
| 请求方式 | 自建 HTTP fetch | SDK 内置 `getRTCToken()` |
| 是否需要 AppServer | 是 | 否 |
| 参数 | `{ username, channelName }` 对象 | `channelName` 字符串（`'*'` 为通配符生成万能 Token） |
| 返回结构 | `{ accessToken, agoraUserId }` | `{ appId, RTCUId, RTCToken }` |

### 3.2 `getRtcToken.js` — 频道用户映射获取

**新增方法** `requestInChannelMapHxId`，替代原 `getChannelDetails.js` 中的 HTTP 请求：

```javascript
// 旧实现（getChannelDetails.js）：手动 HTTP 请求
export default function (EaseIMConn, payload) {
  fetch(`${EaseIMConn.apiUrl}/channel/mapper?userAccount=${username}&channelName=${channelName}&appkey=...`, ...)
}

// 新实现：SDK 内置方法
export async function requestInChannelMapHxId(CallKitEMClient, RTCUIds) {
  const res = await CallKitEMClient.getUserIdByRTCUIds(RTCUIds);
  return res;
}
```

| 对比项 | 改造前 | 改造后 |
|--------|--------|--------|
| 请求方式 | 自建 HTTP fetch | SDK 内置 `getUserIdByRTCUIds()` |
| 是否需要 AppServer | 是 | 否 |
| 参数 | `{ username, channelName }` 对象 | `RTCUIds: number[]`（number 类型数组） |
| 返回结构 | `{ result }` | `AsyncResult<Record<number, string>>` |

### 3.3 `getChannelDetails.js` — 迁移转发

原文件中的 HTTP 请求逻辑已移除，改为转发到 `requestInChannelMapHxId`，保持默认导出兼容：

```javascript
export { requestInChannelMapHxId as default } from './getRtcToken';
```

---

## 四、调用方改造

### 4.1 `index.vue` — 主组件

**import 变更**：

```javascript
// 旧
import getRtcToken from './utils/getRtcToken';
import getChannelDetails from './utils/getChannelDetails';

// 新
import { requestRtcChannelToken, requestInChannelMapHxId } from './utils/getRtcToken';
```

**获取 Token 逻辑变更**：

```javascript
// 旧
const { accessToken, agoraUserId } = await getRtcToken(EaseIMClient, { username, channelName });
callKitStatus.channelInfos.agoraChannelToken = accessToken;
callKitStatus.channelInfos.agoraUserId = agoraUserId;

// 新
const { appId, RTCUId, RTCToken } = await requestRtcChannelToken(EaseIMClient, channelName);
callKitStatus.channelInfos.appId = appId;               // 新增：存储 appId
callKitStatus.channelInfos.agoraChannelToken = RTCToken; // 字段名对齐
callKitStatus.channelInfos.agoraUserId = RTCUId;         // 字段名对齐
```

**获取频道用户映射逻辑变更**：

```javascript
// 旧
const { result } = await getChannelDetails(EaseIMClient, { username, channelName });
callKitStatus.channelInfos.channelUsers = { ...result };

// 新
const res = await requestInChannelMapHxId(EaseIMClient, channelInfos.inChannelUids);
callKitStatus.channelInfos.channelUsers = { ...res.data };
```

### 4.2 `singleCall.vue` / `multiCall.vue` — 通话组件

**import 变更**：移除 `AgoraAppId` 硬编码

```javascript
// 旧
import { AgoraAppId, AgoraRTC } from '../config/initAgoraRtc';

// 新
import { AgoraRTC } from '../config/initAgoraRtc';
```

**加入频道逻辑变更**：`appId` 从 Token 响应动态获取，`join()` 返回值捕获

```javascript
// 旧
await CallKitClient.join(AgoraAppId, channelName, agoraChannelToken, agoraUserId);

// 新
const appId = channelInfos.appId;
const agoraUid = await CallKitClient.join(appId, channelName, agoraChannelToken, agoraUserId);
```

---

## 五、SDK 方法参考

| 方法 | SDK 版本要求 | 文档链接 |
|------|-------------|---------|
| `connection.getRTCToken(channelName: string)` | 4.17.0+ | [getRTCToken](https://doc.easemob.com/apidoc/web/modules/Contact.html#getRTCToken) |
| `connection.getUserIdByRTCUIds(RTCUIds: number[])` | 4.17.0+ | [getUserIdByRTCUIds](https://doc.easemob.com/apidoc/web/modules/Contact.html#getUserIdByRTCUIds) |

---

## 六、注意事项

1. **本组件已废弃**，新项目请直接使用 `easemob-chat-callkit-vue3` 包，参考 `App.vue` 中的 `EasemobChatCallKitProvider` 用法
2. 本次改造保留了所有文件和原有逻辑结构，仅替换了底层请求方式，便于开发者参考对比
3. `getChannelDetails.js` 虽保留但已作为转发文件，实际逻辑统一收敛到 `getRtcToken.js`
4. `initAgoraRtc.js` 中硬编码的 `AgoraAppId` 不再被通话组件引用，但文件保留未删除
