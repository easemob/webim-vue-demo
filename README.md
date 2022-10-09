>Easemob WebIM Demo

# webim vue3 demo简介
webim-vue3-demo是基于环信sdk开发的一款具有单聊、群聊等功能的示例应用，为了vue用户能够快速集成环信IM SDK，我们特使用了vue3+vuex+Element+，为大家提供参考，我们也提供了[react版demo](https://github.com/easemob/webim)。

# 运行起来
+ 说明：发送语音功能需要使用https。
+ 环境：Node 版本要最高于14.18，建议使用Node 16及以上。（Node版本要求主要参考Vue官方文档，以及ElementPlus官方文档）。
``` bash
# install dependencies
npm install or yarn install

# serve with hot reload at localhost:8080
npm run dev or yarn run dev

# build for production with minification
npm run build or yarn build

# build for production and view the bundle analyzer report
npm run build --report
```
# 项目核心结构说明

| 目录  | 说明|   |
|------|-----|------|
| dist  | 打包后的文件 |
| public | public文件 |
| node_modules | 项目依赖
| src | 项目源文件|
|     | components| 公共项目组件
|     | api | request请求api
|     | assets | 静态资源
|     | router | 路由
|     | store | vuex store
|     | IM | sdk 引入和配置
|     | utils | 工具方法
|     | hook | hooks
|     | constants | 常量文件
|     | styles | Element个性化样式以及功能样式
|     | views | 核心视图组件（内含各个模块组件）
|     | App.vue | 根组件
|     | main.js | 入口文件
| .browserslistrc | browserslistrc配置 |
| .eslintrc.js | eslint配置 |
| .gitignore | gitignore配置 |
| babel.config.js | babel配置 |
| jsconfig.json | jsconfig配置 |
| package.json | package包管理配置 |
| vue.config.js | vue相应配置 |


# 主要功能点说明
+ 在线状态订阅变更
+ 用户属性编辑设置
+ 个性名片展示分享
+ 系统消息通知操作
+ 会话联系本地搜索
+ 单聊群聊会话发起
+ 群组好友列表展示
+ 添加删除拉黑好友
+ 创建申请加入群聊
+ 群名公告描述编辑
+ 拉黑禁言群组管理
+ 表情图片语音附件
+ 复制撤回重新编辑
+ 更多功能敬请期待
## sdk集成
示例代码代码目录：src/IM/initwebsdk.js

+ 引入sdk和配置文件，实例化。（参考：initwebsdk.js）
+ 注册监听事件（参考：App.vue）

## 发送消息
代码目录：src/views/chat/components/Message
+ 在inutBox.vue组件里实现发消息，messageList.vue为显示消息上屏。
+ 具体调用SDK发送消息的方法在 src/store/modules/message.js中的 sendShowTypeMessage

## 群组
代码目录：src/views/chat/components/AboutGroups
+ 群组发送消息和单人是一样的只是type不同
+ AboutGroups下为群组设置的代码

## 消息存储
+ 消息存储在 store  > message.js
+ 关于持久化：这个demo采用的sdk消息漫游的增值服务，可以拉取历史消息，当然你也可以采用indexdb来做本地存储，同时也可以开通实时回调服务，将消息同步到自己的服务器。

