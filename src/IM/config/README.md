# IM 配置系统说明

## 📋 目录结构

```
config/
├── index.js          # 配置文件(开发者主要修改此文件)
├── configLoader.js   # 配置加载器(处理配置读取、验证、降级)
└── README.md         # 本说明文档
```

## 🎯 配置优先级

系统按以下优先级加载配置:

```
1. 自定义配置(localStorage) 【最高优先级】
   ↓ (用于线上测试后门)
2. 配置文件(config/index.js)
   ↓ (开发者修改)
3. 默认值
   ↓ (环信官方默认配置)
```

### 配置降级机制

当高优先级配置异常时,会自动降级到下一级配置:

- ✅ **自定义配置** 格式错误 → 自动降级到**配置文件**
- ✅ **localStorage** 读取失败 → 自动降级到**配置文件**
- ✅ **配置文件** 缺失 → 自动降级到**默认值**

## 📝 配置文件说明

### index.js - 主配置文件

开发者主要修改此文件来配置 IM:

```javascript
// ============ 基础配置 ============
// 修改这里的 AppKey 即可快速使用
export const EASEMOB_APPKEY = 'easemob-demo#support';

// ============ 私有化部署配置 (可选) ============
// 是否使用私有化部署
export const IS_PRIVATE_DEPLOYMENT = false;

// 私有化部署服务器地址 (仅在 IS_PRIVATE_DEPLOYMENT 为 true 时生效)
export const EASEMOB_SOCKET_URL = '';
export const EASEMOB_REST_URL = '';
```

**配置项说明:**

| 配置项 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `EASEMOB_APPKEY` | String | ✅ | 环信应用的 AppKey | `'your-org#your-app'` |
| `IS_PRIVATE_DEPLOYMENT` | Boolean | ❌ | 是否使用私有化部署 | `false` |
| `EASEMOB_SOCKET_URL` | String | ❌ | WebSocket 服务地址 | `'//im-api-v2.easemob.com/ws'` |
| `EASEMOB_REST_URL` | String | ❌ | REST API 服务地址 | `'//a1.easemob.com'` |

### configLoader.js - 配置加载器

负责配置的加载、验证和降级,开发者通常**不需要修改**此文件。

**主要功能:**

- ✅ 从 localStorage 安全读取自定义配置
- ✅ 严格验证配置格式(AppKey 格式、必填项检查)
- ✅ 提供配置降级机制(异常时自动降级)
- ✅ 清除损坏的配置数据

**核心方法:**

```javascript
// 加载配置(主入口)
loadIMConfig() → Object

// 验证自定义配置格式
validateCustomConfig(config) → Boolean

// 清除自定义配置
clearCustomConfig() → void
```

## 🔧 使用场景

### 场景1: 开发环境快速配置

**步骤:**
1. 打开 `src/IM/config/index.js`
2. 修改 `EASEMOB_APPKEY` 为你的 AppKey
3. 运行 `npm run dev`

```javascript
export const EASEMOB_APPKEY = 'your-appkey#your-appname';
```

### 场景2: 私有化部署配置

**步骤:**
1. 打开 `src/IM/config/index.js`
2. 设置私有化部署开关和服务器地址

```javascript
export const IS_PRIVATE_DEPLOYMENT = true;
export const EASEMOB_SOCKET_URL = 'wss://your-server.com/ws';
export const EASEMOB_REST_URL = 'https://your-server.com';
```

### 场景3: 线上测试后门

**步骤:**
1. 访问线上页面
2. 快速点击版本号 **5次**
3. 在弹出的配置窗口中填写测试配置
4. 保存后页面自动重载

**特点:**
- ✅ 不影响代码源文件
- ✅ 仅存储在 localStorage
- ✅ 优先级最高,会覆盖配置文件
- ✅ 可随时清除(清空 localStorage 或点击"取消配置")

## 🛡️ 配置验证规则

### AppKey 格式验证

AppKey 必须符合以下格式: `组织名#应用名`

**正则表达式:**
```javascript
/^[a-zA-Z0-9-]+#[a-zA-Z0-9-]+$/
```

**有效示例:**
- ✅ `easemob-demo#support`
- ✅ `my-org#my-app`
- ✅ `test123#app456`

**无效示例:**
- ❌ `easemob` (缺少 `#`)
- ❌ `easemob#` (缺少应用名)
- ❌ `#support` (缺少组织名)
- ❌ `easemob support` (包含空格)
- ❌ `easemob@support` (分隔符错误)

### 私有化部署验证

当 `isPrivate: true` 时:
- `imServer` (可选): 必须是字符串类型
- `restServer` (可选): 必须是字符串类型

## 🔍 调试信息

配置加载器会输出详细的调试信息:

```javascript
// 成功加载自定义配置
[配置加载器] 成功加载自定义配置
[配置加载器] 使用自定义配置(线上测试)

// 降级到配置文件
[配置加载器] 自定义配置格式无效,已忽略
[配置加载器] 使用配置文件

// 配置读取失败
[配置加载器] 读取自定义配置失败: [错误信息]
[配置加载器] 已清除损坏的自定义配置
[配置加载器] 使用配置文件

// SDK 初始化完成
[SDK初始化] 最终配置: {appKey: "...", ...}
[SDK初始化] 插件注册完成
```

## 📦 localStorage 数据结构

自定义配置存储在 localStorage 中,键名为 `EASEIM_CUSTOM_CONFIG`:

```javascript
{
  "appKey": "your-appkey#your-appname",
  "isPrivate": false,
  "imServer": "",
  "restServer": ""
}
```

## ⚠️ 常见问题

### Q1: 配置修改后没有生效?
**A:** 
1. 检查 AppKey 格式是否正确
2. 清除浏览器 localStorage (可能有线上测试配置覆盖)
3. 重启开发服务器

### Q2: 如何清除线上测试配置?
**A:**
```javascript
// 方法1: 浏览器控制台执行
localStorage.removeItem('EASEIM_CUSTOM_CONFIG');

// 方法2: 使用配置加载器提供的方法
import { clearCustomConfig } from '@/IM/config/configLoader';
clearCustomConfig();
```

### Q3: 如何知道当前使用的是哪个配置?
**A:** 查看浏览器控制台,配置加载器会输出:
- `[配置加载器] 使用自定义配置(线上测试)` - 来自 localStorage
- `[配置加载器] 使用配置文件` - 来自 config/index.js

### Q4: 配置文件支持环境变量吗?
**A:** 可以配合 `.env` 文件使用:

```javascript
// .env.development
VITE_EASEMOB_APPKEY=dev-org#dev-app

// config/index.js
export const EASEMOB_APPKEY = import.meta.env.VITE_EASEMOB_APPKEY || 'easemob-demo#support';
```

## 🚀 最佳实践

1. **开发环境**: 使用配置文件 (`config/index.js`)
2. **生产环境**: 使用环境变量或配置文件
3. **线上测试**: 使用后门功能(点击版本号5次)
4. **私有化部署**: 在配置文件中设置 `IS_PRIVATE_DEPLOYMENT = true`

## 📚 相关文件

- [sdk/index.js](../sdk/index.js) - SDK 初始化模块
- [config/index.js](./index.js) - 主配置文件
- [config/configLoader.js](./configLoader.js) - 配置加载器
