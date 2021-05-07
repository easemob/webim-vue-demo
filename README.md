>Easemob WebIM Demo

# webim vue demo简介
webim-vue demo是基于环信sdk开发的一款具有单聊、群聊、聊天室、音视频等功能的应用，为了vue用户能够快速集成环信 im sdk和音视频sdk，我们特使用了vue+vuex，为大家提供参考，我们也提供了[react版demo](https://github.com/easemob/webim)。

# 运行起来
+ 说明：音视频功能需要使用https。
+ 环境：Node 版本要低于 12.x，建议使用 10.x
``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm start || HTTPS=true npm start

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```
# 项目结构

| 目录  | 说明|   |
|------|-----|------|
| build  | 打包后的文件 |
| config | 项目的配置 |
| node_modules | 项目依赖
| static | 资源文件 |
| travis | CI脚本 |
| src | 项目源文件|
|     | components| 项目组件
|     | config | 表情和项目中ui配置
|     | pages | 项目页面
|     | router | 路由
|     | store | vuex store
|     | utils | sdk 引入和配置

# 主要功能点说明
## sdk集成
代码目录：src/utils/WebIM.js

+ 引入sdk和配置文件，实例化。
+ 注册监听事件

## 发送消息
代码目录：src/components/chat/index.vue
+ 在chat组件里实现发消息以及消息上屏,index为发送消息，message为显示消息上屏
+ 具体发送消息的方法在 src/store/chat

## 音视频
代码目录: src/components/emediaModal
+ index为单人音视频， multiAVModal为多人音视频，

## 群组
代码目录：src/components/group
+ 群组发送消息和单人是一样的只是type不同
+ group下为群组设置的代码

## 消息存储
+ 消息存储在 store > chat > msgList
+ 关于持久化：这个demo采用的sdk消息漫游的增值服务，可以拉取历史消息，当然你也可以采用indexdb来做本地存储，同时也可以开通实时回调服务，将消息同步到自己的服务器。
# 写在最后
第一期已经完成了绝大部门im基础功能，大家也可以取查看官方详细[文档](http://docs-im.easemob.com/im/web/intro/start) 当然由于接触vue时间有限，这个demo只是给大家一个参考，很多地方的实现并不是很多，大家就自行发挥吧，后续会持续优化和更新。
