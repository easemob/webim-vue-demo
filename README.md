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
<<<<<<< HEAD
npm start or yarn run dev
=======
npm run dev or yarn run dev
>>>>>>> remotes/vue-demo/demo-vue3

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
-   复制撤回重新编辑
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
