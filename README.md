# Vue 集成单群聊 UIKit

本文介绍如何在 Vue 项目集成单群聊 UIKit。

## 前提条件

开始前，确保你的开发环境满足如下条件：
- 熟悉命令行
- 即时通讯 IM 项目和 App Key。

## 操作步骤

### 第一步 创建一个 Vue 项目

Vue 提供了一个方便的命令行工具来快速构建应用程序。确保你的当前工作目录正是打算创建项目的目录。在命令行中运行以下命令 

```bash
	npm init vue@latest
```

此命令将引导您完成创建新项目时的选项。下面列出了本教程使用的设置。

```bash
Vue.js - The Progressive JavaScript Framework

✔ Project name: … vue-project
✔ Add TypeScript? … No
✔ Add JSX Support? … Yes
✔ Add Vue Router for Single Page Application development? … Yes
✔ Add Pinia for state management? … No
✔ Add Vitest for Unit Testing? … No
✔ Add an End-to-End Testing Solution? › No
✔ Add ESLint for code quality? … No
✔ Add Vue DevTools 7 extension for debugging? (experimental) … No

```

以开发模式运行

```bash
cd vue-project
npm install
npm run dev
```

运行成功后打开 http://localhost:5173/ ，可以看到

<img src="./WechatIMG514.jpg" alt="vue" width="500px">

### 第二步 安装和配置 Veaury

[Veaury ](https://github.com/gloriasoft/veaury#readme)是基于 React 和 Vue 的工具库，主要用于 React 和 Vue 在一个项目中公共使用的场景，Veaury 适用于 Vue 3 和 Vue 2，可以使用以下命令从 npm 安装该库：

```bash
npm i veaury
```

安装@vitejs/plugin-react 插件

```bash
npm i @vitejs/plugin-react
```

为了使 Vue 应用能够导入和呈现 React 组件，需要更新项目中的 vite.config.js 文件以使用 Veaury 插件。
[Veaury配置参考](https://github.com/gloriasoft/veaury/blob/master/README_zhcn.md#vite)

```javascript
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
// >= veaury@2.1.1
import veauryVitePlugins from "veaury/vite/index.js";
// 如果是vite 6, 应该使用 `veaury/vite/esm`
// import veauryVitePlugins from 'veaury/vite/esm'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // 关闭 vue 和 vuejsx 插件
    // vue(),
    // vueJsx(),
    // type设为vue时, 所有名为react_app目录中的文件的jsx将被react jsx编译，其他文件里的jsx将以vue jsx编译
    veauryVitePlugins({
      type: "vue"
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
```

在这个配置更改之后，你可以将任何 React 组件添加到名为 `react_app` 的目录中。然后可以将这些 React 组件导入到 .vue 文件中，并在标准 Vue 组件中呈现。

### 第三步 在 Vue 项目中集成 React 组件

首先，你需要在 react_app 中创建一个新的 React 组件。该组件负责导入、配置和渲染 UIKit。

1. 安装 UIKit

   ```bash
   npm i easemob-chat-uikit --save;
   ```

2. 创建 react_app/chat.jsx 文件，导入 UIKit，使用环信 IM 的 appKey 和用户信息初始化 UIKit
   
   <img src="./WechatIMG517.jpg" alt="react_app" width="300px">

代码如下
```jsx
// react_app/chat.jsx 导入组件
import { UIKitProvider, Chat, ConversationList } from "easemob-chat-uikit";
// 引入UIKit样式
import 'easemob-chat-uikit/style.css'

const appKey = "your appkey";
const userId = "userId";
const password = "password";

const EaseChat = (props) => {
  // 父组件传入的theme属性
  const { theme } = props;
  return (
    <UIKitProvider
      initConfig={{
        appKey,
        userId,
        password
      }}
      theme={{
        mode: theme
      }}
    >
      <div className="chat-wrap">
        <div className="conversation-list">
          <ConversationList></ConversationList>
        </div>
        <div className="chat">
          <Chat></Chat>
        </div>
      </div>
    </UIKitProvider>
  );
};

export default EaseChat;
```

### 第四步 将 UIKit 添加到 Vue 页面

接下来，将 EaseChat 添加 Vue 页面, 删除当前在 views/HomeView.vue 中的所有代码并添加下面的代码。

此代码执行以下操作：

1. 导入 Veaury 和 EaseChat 聊天组件
2. 使用 Veaury 的 applyPureReactInVue 函数将我们的 React 组件转换为 Vue 组件
3. 定义 `theme` 变量，传递给 EaseChat 组件，用来切换 UIKit 的主题
4. 添加一些样式，使其看起来更好

```javascript
<script setup>
import { ref } from "vue";
import { applyPureReactInVue } from "veaury";
import EaseChat from "../react_app/chat";
import Logo from "../assets/logo.svg";

const Chat = applyPureReactInVue(EaseChat);

const theme = ref("light");

const switchTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
};
</script>

<template>
  <header>
    <div class="header">
      <img class="logo" :src="Logo" alt="logo" />
      <span class="theme" @click="switchTheme">Switch Theme: {{ theme }}</span>
    </div>
  </header>
  <main>
    <Chat :theme="theme" />
  </main>
</template>

<style>
.chat-wrap {
  width: 100%;
  height: calc(100vh - 50px);
  display: flex;
  box-sizing: border-box;
}

.conversation-list {
  width: 300px;
  flex-shrink: 0;
}

.chat {
  width: 100%;
}
</style>

<style scoped>
.header {
  display: flex;
  height: 50px;
  font-size: 20px;
  background: #4faeea;
  padding: 0 20px;
  align-items: center;
  justify-content: space-between;
}

.theme {
  cursor: pointer;
}

.logo {
  width: 45px;
}
</style>

```
删除 App.vue 文件 template 中的无关代码，仅保留RouterView，当访问 http://localhost:5173 时，展示应该是这样的：

<img src="./WechatIMG518.jpg" alt="uikit" width="500px">

点击切换主题

<img src="./WechatIMG519.jpg" alt="uikit" width="500px">

# 相关参考
- [示例项目源码]()
- [组件库源码](https://github.com/easemob/Easemob-UIKit-web)
- [其他示例 demo](https://github.com/easemob/Easemob-UIKit-web/demo)
- [`UIKitProvider` 文档](https://doc.easemob.com/uikit/chatuikit/web/chatuikit_provider.html)
