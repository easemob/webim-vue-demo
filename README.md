> Easemob WebIM Demo

# webim vue3 demo 简介

webim-vue3-demo 是基于环信 sdk 开发的一款具有单聊、群聊等功能的示例应用，为了 vue 用户能够快速集成环信 IM SDK，我们特使用了 vue3+vuex+Element+，为大家提供参考，我们也提供了[react 版 demo](https://github.com/easemob/webim)。

# 运行起来

- 说明：发送语音功能需要使用 https。
- 环境：Node 版本建议使用 `Node 16、17`不推荐 Node 18 及以上。（Node 版本要求主要参考 Vue 官方文档，以及 ElementPlus 官方文档）。

```bash
# install dependencies
npm install or yarn install

# serve with hot reload at localhost:9001
npm run dev or yarn run dev

# build for production with minification
npm run build or yarn build

# build for production and view the bundle analyzer report
npm run build --report
```

# 项目核心结构说明

| 目录            | 说明                |                                  |
| --------------- | ------------------- | -------------------------------- |
| dist            | 打包后的文件        |
| public          | public 文件         |
| node_modules    | 项目依赖            |
| src             | 项目源文件          |
|                 | components          | 公共项目组件                     |
|                 | api                 | request 请求 api                 |
|                 | assets              | 静态资源                         |
|                 | router              | 路由                             |
|                 | store               | vuex store                       |
|                 | IM                  | sdk 引入和配置                   |
|                 | utils               | 工具方法                         |
|                 | hook                | hooks                            |
|                 | constants           | 常量文件                         |
|                 | styles              | Element 个性化样式以及功能样式   |
|                 | views               | 核心视图组件（内含各个模块组件） |
|                 | App.vue             | 根组件                           |
|                 | main.js             | 入口文件                         |
| .browserslistrc | browserslistrc 配置 |
| .eslintrc.js    | eslint 配置         |
| .gitignore      | gitignore 配置      |
| babel.config.js | babel 配置          |
| jsconfig.json   | jsconfig 配置       |
| package.json    | package 包管理配置  |
| vue.config.js   | vue 相应配置        |

# 主要功能点说明

- 在线状态订阅变更
- 用户属性编辑设置
- 个性名片展示分享
- 系统消息通知操作
- 会话联系本地搜索
- 单聊群聊会话发起
- 群组好友列表展示
- 添加删除拉黑好友
- 创建申请加入群聊
- 群名公告描述编辑
- 拉黑禁言群组管理
- 表情图片语音附件
- 复制撤回消息举报
- 单人多人视频呼叫
- 更多功能敬请期待

## 环信 SDK 集成

> SDK 的初始化是 IM 功能实现的基石必须经过`引入SDK`、`实例化SDK`、`挂载SDK事件监听`、`引入实例`这几步。

- [SDK 所需配置](./src/IM/config/index.js)
- [初始化 SDK](./src/IM/miniCore/index.js)
- [导出初始化 SDK 实例](./src/IM/index.js)
- [实现逻辑时 SDK 关联常量(单独集成非必须)](./src/IM/constant/)
- [SDK 事件监听回调](./src/IM/listener/)
- [挂载 SDK 所需事件监听](./src/App.vue)

> 实际使用效果如下面示例代码：

```javascript
import { EMClient } from '@/IM';
import { mountAllEMListener } from '@/IM/listener';
/* 【重要】挂载IM相关监听回调。 */
mountAllEMListener();
//登录
EMClient.open({ username: '', password: '' });
```

## 登录

> 该项目中的登录所用接口为远端 api 接口+SDK Token 登录接口实现的 IM 服务连接，在实际项目中需自行搭建`userToken`获取接口。

- [登录 IM](./src/views/Login/components/LoginInput/index.vue)
- [连接成功相关监听并跳转路由](./src/IM/listener/imConnectListener.js)

## 会话列表

> 通过登录页面进入聊天页面，右侧会展示一个有过最近会话关系的会话列表，该会话列表核心使用了`miniCore`中的`localCache`插件进行了 API 实现以及数据源管理获取。

- [会话列表的数据更新获取](./src/store/modules/conversation.js)
- [会话列表的渲染](./src/views/Chat/components/Conversation/)
- [会话列表的搜索](./src/components/SearchInput/index.vue)

## 收发消息

> 该板块为 IM 需求核心功能，通过查看以下内容可以了解相关功能的实现。

### 发送消息

> 利用 SDK 提供的丰富的消息类型实现不同功能的消息发送，并将发送的消息缓存至`vuex`。

- [发送文本消息](./src/views/Chat/components/Message/components/ChatInputBox/components/TextMessage/index.vue)
- [发送图片消息](./src/views/Chat/components//Message/components/ChatInputBox/components/ImageMessage/index.vue)
- [贴图发送图片消息](./src/views/Chat/components/Message/components/suit/previewSendImg.vue)
- [语音消息发送](./src/views/Chat/components/Message/components/ChatInputBox/index.vue)
- [文件消息发送](./src/views/Chat/components/Message/components/ChatInputBox/components/FileMessage/index.vue)
- [视频消息发送](./src/views/Chat/components/Message/components/ChatInputBox/components/VideoMessage/index.vue)
- [自定义消息发送(个人名片)](./src/views/Chat/components/Message/components/ChatInputBox/components/CustomMessage/ShareUserCard.vue)

---

- [Emoji 表情](./src/views/Chat/components/Message/components/suit/emojiContainer.vue)

- [消息引用](./src/views/Chat/components/Message/components/suit/msgQuote.vue)

- [编辑文本消息](./src/views/Chat/components/Message/components/suit/modifyMessage.vue)
- [消息举报](./src/views/Chat/components/Message/components/suit/reportMessage.vue)

### 接收消息缓存消息

> 接收消息通过 SDK 的事件监听获取数据源，而消息数据则存储在`vuex`中进行缓存，刷新页面后进入聊天页的数据则是通过 SDK 提供的获取漫游消息实现。

- [接收消息内容](./src/IM/listener/imReciveMessageListener.js)
- [收发消息缓存数据](./src/store/modules/message.js)

### 消息上屏展示

> 消息内容的上屏展示则是从`vuex`中缓存的消息数据进行响应式更新渲染。

- [消息内容上屏展示](./src/views/Chat/components/Message/components/ChatMessageListItem/index.vue)

## 群组

> 在群组聊天中点击右上角更多展开的“抽屉”中，可以实现对群组信息的查看或者管理。

- [群组基础信息展示修改](./src/views/Chat/components/AboutGroups/GroupsDetails/index.vue)
- [群组成员禁言或黑名单管理](./src/views/Chat/components/AboutGroups/GroupsManagement/index.vue)
- [群组内事件监听](./src/IM/listener/imGroupListener.js)
- [群组数据管理](./src/store/modules/groups.js)

## 联系人

> 在联系人中展示登录用户的好友关系列表以及加入的群组列表。

- [联系人组件](./src/views/Chat/components/Contacts/index.vue)
- [联系人详情](./src/views/Chat/components/Contacts/components/ContactInfos.vue)
- [联系人搜索](./src/components/SearchInput/index.vue)

## NavBar

> 在 NavBar 组件中包含对登录用户的头像信息展示，在线状态变更，会话以及联系人的切换，创建群组添加联系人，个人信息的展示修改，基础设置提供了点击入口。

- [用户信息](./src/views/Chat/components/NavBar/components/AboutUserInfoCard/)
- [创建群组、添加联系人、申请入群](./src/views/Chat/components/NavBar/components/ApplyComponents/)
- [个人设置](./src/views/Chat/components/NavBar/components/PersonalsettingCard/index.vue)
- [在线状态展示](./src/views/Chat/components/NavBar/components/UserOnlineStatusCard.vue)
- [退出登录](./src/views/Chat/components/NavBar/components/Logout.vue)

## 关于 `EaseCallKit` 的使用说明

> 在使用 Vue3 框架时，除了集成环信 WebIM，通过集成声网音视频功能以 IM 作为通话信令来实现音视频通话，也是较为常见的使用场景，并且环信移动原生端已经实现了 EaseCallKit 将音视频通话功能可类似为模块导入的形式快速引入，因此本 Demo 中同样尝试也将音视频相关逻辑单独抽离为一个组件，并且可以脱离此 Demo 单独将其引入到自己的 Vue3 项目中，快速完整音视频功能的搭建。

### 必要前置准备

1. 已在环信管理后台创建项目生成对应 Appkey，在项目中引入并且完成针对环信 IMSDK 的初始化工作。相关步骤可参考上述`环信 SDK 集成 `

2. 确保已在 Agora 声网创建项目生成 appId【与 Appkey 概念相同】，并在项目中安装 Agora 声网相关 SDK。

3. 在 EaseCallKit 当中有一些功能的实现有用到 `vueUse`功能库，所以也需要安装 `vueUse` 相关依赖，此时你的项目目录中包含以下三个包名。

```json
 "dependencies": {
            "agora-rtc-sdk-ng": "latest",
            "easemob-websdk": "latest",
            "@vueuse/core": "latest",
 }
```

4. 确保自己的服务端已经搭建了声网房间鉴权的 `AppServer` 服务，此服务作用是，请求服务端接口获取 `channel`（音视频房间） 对应的 `token`（房间钥匙 🔑） 用以加入 `channel`，此 Demo 中用的是环信已经搭建的 `appServer` 服务，一个服务仅供一个 `appId` 使用，因此需要搭建自己的 `appServer`。

> 具体相关文档说明
> [声网快速开始](https://doc.shengwang.cn/doc/rtc/javascript/get-started/quick-start)

### 如何使用

- 在 compoents 中找到 EaseCallKit 组件，完整 copy 整个文件夹，至自己所需的目录中。
- 打开 EaseCallkit 文件夹，在 config 文件夹下 _initAgoraRtc.js_ 中将自己的 appId 贴入替换 AgoraAppId。

```javascript
import AgoraRTC from 'agora-rtc-sdk-ng';

const AgoraAppId = 'YOUR AOGRA APPID';

export { AgoraAppId, AgoraRTC };
```

- EaseCallKit 的 _utils_ 文件夹下分别有`getRtcToken.js` 以及`getChannelDetails.js` 这两个 js 文件。这两个 js 文件的作用为:

  - getRtcToken 向 AppServer 请求 channel 鉴权 token，在确保服务端已经搭建了 token 鉴权服务，请把地址以及请求参数替换为自己服务所要求的参数，特别提醒：该接口主要用户获取加入频道的 channel token，以及生成加入频道的`uid`，`uid`字段主要用与频道内的唯一 id，该字段`强烈建议为int类型`，因为经验证该类型与其他移动端通信方为正常。`string 类型会有异常`。
    > getChannelDetails 后端提供的 rtc channel 中的 uid 映射对应用户身份的接口，Demo 映射的是对应的环信 ID，而实际我们的服务可以选择调整为映射自己用户体系当中的对应数据，非必须但是 EaseCallKit 有用到此接口，可以自行找到相关代码进行剔除。

- 在 App.vue 中引入 EaseCallKit 组件（实际项目中可以在所需位置引入），传入 EaseIMClient（也就是实例化后的 IM SDK），第二传入 msgCreateFunc ，（IMSDK 下的 message 方法）主要用于 EaseCallKit 当中信令消息构建使用。如果需要多人通话场景，那么多人中应该会有邀请他人通话的场景，当点击邀请的时候需要弹出对应的邀请弹框或者调到对应的邀请页面，EaseCallKit 组件内进行对外事件的触发 onInviteMembers，正是充当此作用。

```javascript
<EaseCallKit
    ref="easeCallKit"
    :EaseIMClient="EaseChatClient"
    :msgCreateFunc="EaseChatSDK.message"
    @onInviteMembers="showModal"
/>
```

- EaseCallKit 组件音视频通话有三种模式，0 单人音频、1 单人视频、2 多人视频，在需要进行邀请的部分，引入 EaseCallKit 内的 hooks,从中取出 CALL*TYPE 常量，以及邀请方法，发送邀请时，传入要邀请的目标 ID 以及对应类型，即可发送邀请，多人场景传入 toId 为数组形式。
  详细的 Demo 实现的参考代码位置在 \_views/Chat/components/Message/components/inputBox.vue*

```javascript
import { useManageChannel } from '@/components/EaseCallKit/hooks';
const { CALL_TYPES, sendInviteMessage } = useManageChannel();
const callType = CALL_TYPES.SINGLE_VIDEO;
sendInviteMessage(toId, callType);
```

- 在外层使用这个 EaseCallKit 的时候如何知道其内部所产生的各种各项事件呢？比如对方挂断，拒接，通话结束？组件内使用类似发布订阅的模式对外抛出了时间，订阅则可以收到内部抛出的各种事件，具体用法是：
  import EaseCallKit 下 hooks 中的 `useCallKitEvent`，并从中取出订阅方法，取消订阅方法以及一些事件常量，示例代码如下。

```javascript
import { useCallKitEvent } from '@/components/EaseCallKit/hooks';
const {
  EVENT_NAME,
  CALLKIT_EVENT_CODE,
  SUB_CHANNEL_EVENT,
  UN_SUB_CHANNEL_ENENT,
} = useCallKitEvent();
SUB_CHANNEL_EVENT(EVENT_NAME, (param) => {
  /* 
事件对外抛出包含有对应的事件type，type/code 可以自行判断处理，ext字段内有对外传出的事件中文描述，可自行选择是否使用。
*/
  const { type, ext, callType, eventHxId } = param;
  if (
    type.code === CALLKIT_EVENT_CODE.CALLEE_REFUSE ||
    type.code === CALLKIT_EVENT_CODE.CALLEE_BUSY ||
    type.code === CALLKIT_EVENT_CODE.OTHER_HANDLE
  ) {
    ElMessage({
      type: 'error',
      message: ext.message,
      center: true,
    });
    const params = {
      from: EaseChatClient.user,
      to: eventHxId,
      chatType: callType === 2 ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
      msg: ext.message,
    };
    store.dispatch('createInformMessage', { ...params });
  } else if (
    type.code === CALLKIT_EVENT_CODE.NOT_HAVE_MICROPHONE ||
    type.code === CALLKIT_EVENT_CODE.NOT_HAVE_CAMERA
  ) {
    ElMessage({
      type: 'warning',
      message: ext.message,
      center: true,
    });
  } else if (eventHxId) {
    const params = {
      from: EaseChatClient.user,
      to: eventHxId,
      chatType: callType === 2 ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
      msg: ext.message,
    };
    store.dispatch('createInformMessage', { ...params });
  }
});

//取消订阅
onBeforeUnmount(() => {
  UN_SUB_CHANNEL_ENENT(EVENT_NAME);
});
```

### 结语

至此就完成了组件所有的使用引入，一些疑点可结合实际代码综合起来看，有任何 IM 以及 EaseCallKit 相关的问题疑问，可以再 issues 上进行提出并描述，我们会尽力协助解决遇到的问题。
