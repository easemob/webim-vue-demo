> Easemob WebIM Demo

# webim vue3 demo 简介

webim-vue3-demo 是基于环信 sdk 开发的一款具有单聊、群聊等功能的示例应用，为了 vue 用户能够快速集成环信 IM SDK，我们特使用了 vue3+vuex+Element+，为大家提供参考，我们也提供了[react 版 demo](https://github.com/easemob/webim)。

# 运行起来

-   说明：发送语音功能需要使用 https。
-   环境：Node 版本要最高于 14.18，建议使用 Node 16 及以上。（Node 版本要求主要参考 Vue 官方文档，以及 ElementPlus 官方文档）。

```bash
# install dependencies
npm install or yarn install

# serve with hot reload at localhost:8080
npm start or yarn run dev

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

-   在线状态订阅变更
-   用户属性编辑设置
-   个性名片展示分享
-   系统消息通知操作
-   会话联系本地搜索
-   单聊群聊会话发起
-   群组好友列表展示
-   添加删除拉黑好友
-   创建申请加入群聊
-   群名公告描述编辑
-   拉黑禁言群组管理
-   表情图片语音附件
-   复制撤回消息举报
-   单人多人视频呼叫
-   更多功能敬请期待

## sdk 集成

示例代码代码目录：src/IM/initwebsdk.js

-   引入 sdk 和配置文件，实例化。（参考：initwebsdk.js）
-   注册监听事件（参考：App.vue）

## 发送消息

代码目录：src/views/chat/components/Message

-   在 inutBox.vue 组件里实现发消息，messageList.vue 为显示消息上屏。
-   具体调用 SDK 发送消息的方法在 src/store/modules/message.js 中的 sendShowTypeMessage

## 群组

代码目录：src/views/chat/components/AboutGroups

-   群组发送消息和单人是一样的只是 type 不同
-   AboutGroups 下为群组设置的代码

## 消息存储

-   消息存储在 store > message.js
-   关于持久化：这个 demo 采用的 sdk 消息漫游的增值服务，可以拉取历史消息，当然你也可以采用 indexdb 来做本地存储，同时也可以开通实时回调服务，将消息同步到自己的服务器。

## EaseCallKit 的使用说明

> 在使用 Vue3 框架时，除了集成环信 WebIM，通过集成声网音视频功能以 IM 作为通话信令来实现音视频通话，也是较为常见的使用场景，并且环信移动原生端已经实现了 EaseCallKit 将音视频通话功能可类似为模块导入的形式快速引入，因此本 Demo 中同样也将音视频相关逻辑单独抽离为一个组件，并且可以脱离此 Demo 单独将其引入到自己的 Vue3 项目中，快速完整音视频功能的搭建。

### 前置准备

1. 已在环信管理后台创建项目生成对应 Appkey，在项目中引入并且完成针对环信 IMSDK 的初始化工作。

```javascript
//import 环信SDK
import EaseChatSDK from 'easemob-websdk'

//实例化环信SDK
const EaseChatClient = new EaseChatSDK.connection({
    appKey: 'YOUR APPKEY'
})
export { EaseChatSDK, EaseChatClient }
```

2. 确保已在 Agora 声网创建项目生成 appId【与 Appkey 概念相同】，并在项目中安装 Agora 声网相关 SDK。

3. 在 EaseCallKit 当中有一些功能的实现有用到 vueUse 所以也需要安装 vueUse 相关依赖，此时你的项目目录中包含以下三个包名。

```json
 "dependencies": {
            "agora-rtc-sdk-ng": "^4.14.0",
            "easemob-websdk": "4.1.1",
            "@vueuse/core": "^8.4.2",
 }
```

4. 确保自己的服务端已经搭建了声网房间鉴权的 AppServer 服务，此服务作用是，请求服务端接口获取 channel 对应的 token 用以加入 channel，此 Demo 中用的是环信已经搭建的 appServer 服务，一个服务仅供一个 appId 使用，因此需要搭建自己的 appServer。

    具体相关文档说明
    [点击查看](https://docs.agora.io/cn/video-call-4.x/token_upgrade?platform=Web)

### 如何使用

-   在 compoents 中找到 EaseCallKit 组件，完整 copy 整个文件夹，至自己所需的目录中。
-   打开 EaseCallkit 文件夹，在 config 文件夹下 _initAgoraRtc.js_ 中将自己的 appId 贴入替换 AgoraAppId。

```javascript
import AgoraRTC from 'agora-rtc-sdk-ng'

const AgoraAppId = 'YOUR AOGRA APPID'

export { AgoraAppId, AgoraRTC }
```

-   EaseCallKit 的 _utils_ 文件夹下分别有*getRtcToken.js* 以及*getChannelDetails.js* 这两个 js 文件。这两个 js 文件的作用为:

    > getRtcToken 向 AppServer 请求 channel 鉴权 token，在确保服务端已经搭建了 token 鉴权服务，请把地址以及请求参数替换为自己服务所要求的参数。

    > getChannelDetails 后端提供的 rtc channel 中的 uid 映射对应用户身份的接口，Demo 映射的是对应的环信 ID，而实际我们的服务可以选择调整为映射自己用户体系当中的对应数据，非必须但是 EaseCallKit 有用到此接口，可以自行找到相关代码进行剔除。

-   在 App.vue 中引入 EaseCallKit 组件（实际项目中可以在所需位置引入），传入 EaseIMClient（也就是实例化后的 IM SDK），第二传入 msgCreateFunc ，（IMSDK 下的 message 方法）主要用于 EaseCallKit 当中信令消息构建使用。如果需要多人通话场景，那么多人中应该会有邀请他人通话的场景，当点击邀请的时候需要弹出对应的邀请弹框或者调到对应的邀请页面，EaseCallKit 组件内进行对外事件的触发 onInviteMembers，正是充当此作用。

```javascript
<EaseCallKit
    ref="easeCallKit"
    :EaseIMClient="EaseChatClient"
    :msgCreateFunc="EaseChatSDK.message"
    @onInviteMembers="showModal"
/>
```

-   EaseCallKit 组件音视频通话有三种模式，0 单人音频、1 单人视频、2 多人视频，在需要进行邀请的部分，引入 EaseCallKit 内的 hooks,从中取出 CALL*TYPE 常量，以及邀请方法，发送邀请时，传入要邀请的目标 ID 以及对应类型，即可发送邀请，多人场景传入 toId 为数组形式。
    详细的 Demo 实现的参考代码位置在 \_views/Chat/components/Message/components/inputBox.vue*

```javascript
import { useManageChannel } from '@/components/EaseCallKit/hooks'
const { CALL_TYPES, sendInviteMessage } = useManageChannel()
const callType = CALL_TYPES.SINGLE_VIDEO
sendInviteMessage(toId, callType)
```

-   在外层使用这个 EaseCallKit 的时候如何知道其内部所产生的各种各项事件呢？比如对方挂断，拒接，通话结束？组件内使用类似发布订阅的模式对外抛出了时间，订阅则可以收到内部抛出的各种事件，具体用法是：
    import EaseCallKit 下 hooks 中的 useCallKitEvent，并从中取出订阅方法，取消订阅方法以及一些事件常量，示例代码如下。

```javascript
import { useCallKitEvent } from '@/components/EaseCallKit/hooks'
const {
    EVENT_NAME,
    CALLKIT_EVENT_CODE,
    SUB_CHANNEL_EVENT,
    UN_SUB_CHANNEL_ENENT
} = useCallKitEvent()
SUB_CHANNEL_EVENT(EVENT_NAME, (param) => {
    console.log('%c>>>>>>订阅事件触发', 'color:blue', param)
    /* 
事件对外抛出包含有对应的事件type，type/code 可以自行判断处理，ext字段内有对外传出的事件中文描述，可自行选择是否使用。
*/
    const { type, ext, callType, eventHxId } = param
    if (
        type.code === CALLKIT_EVENT_CODE.CALLEE_REFUSE ||
        type.code === CALLKIT_EVENT_CODE.CALLEE_BUSY ||
        type.code === CALLKIT_EVENT_CODE.OTHER_HANDLE
    ) {
        ElMessage({
            type: 'error',
            message: ext.message,
            center: true
        })
        const params = {
            from: EaseChatClient.user,
            to: eventHxId,
            chatType: callType === 2 ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
            msg: ext.message
        }
        store.dispatch('createInformMessage', { ...params })
    } else if (
        type.code === CALLKIT_EVENT_CODE.NOT_HAVE_MICROPHONE ||
        type.code === CALLKIT_EVENT_CODE.NOT_HAVE_CAMERA
    ) {
        ElMessage({
            type: 'warning',
            message: ext.message,
            center: true
        })
    } else if (eventHxId) {
        const params = {
            from: EaseChatClient.user,
            to: eventHxId,
            chatType: callType === 2 ? CHAT_TYPE.GROUP : CHAT_TYPE.SINGLE,
            msg: ext.message
        }
        store.dispatch('createInformMessage', { ...params })
    }
})

//取消订阅
onBeforeUnmount(() => {
    UN_SUB_CHANNEL_ENENT(EVENT_NAME)
})
```

### 结语

至此就完成了组件所有的使用引入，一些疑点可结合实际代码综合起来看，有任何 IM 以及 EaseCallKit 相关的问题疑问，可以再 issues 上进行提出并描述，我们会尽力协助解决遇到的问题。
