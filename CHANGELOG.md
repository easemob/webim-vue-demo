# Changelog

本文档记录 webim-vue3-demo 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 重构 - 2026-01-30

#### ✨ 核心改进

**配置系统重构**
- 🎯 **简化配置流程**：用户仅需修改 `src/IM/config/index.js` 中的 `EASEMOB_APPKEY` 即可快速运行项目
- 🏗️ **架构优化**：配置加载、SDK 初始化、配置定义完全分离，遵循单一职责原则
- 📦 **配置优先级系统**：localStorage > 配置文件 > 默认值，支持多场景灵活配置

#### 🆕 新增功能

**配置加载器 (configLoader.js)**
- ✅ 从多个来源安全加载配置（localStorage、配置文件、默认值）
- ✅ 严格的配置格式验证（AppKey 格式校验：`/^[a-zA-Z0-9-]+#[a-zA-Z0-9-]+$/`）
- ✅ 智能降级机制：配置异常时自动降级到下一优先级
- ✅ 异常捕获与自动修复：损坏的配置会被自动清理

**线上测试后门功能**
- 🔧 点击版本号 5 次可弹出自定义配置窗口
- 🔧 配置存储在 localStorage，不影响代码源文件
- 🔧 支持在线上环境快速切换测试配置

**完整配置文档**
- 📚 新增 237 行详细配置文档 `src/IM/config/README.md`
- 📚 包含配置项说明、使用场景、验证规则、常见问题等
- 📚 提供清晰的调试信息说明

#### 🔧 优化改进

**目录结构语义化**
- 📁 `src/IM/miniCore/` → `src/IM/sdk/`：更直观地表达 SDK 初始化功能
- 📝 SDK 初始化模块从 95 行简化至 54 行（减少 43%）
- 📝 职责清晰：只负责 SDK 实例化和插件注册

**配置文件简化**
- 🎨 `src/IM/config/index.js`：移除冗余的默认值常量导出
- 🎨 结构清晰，注释完善，降低新用户学习成本
- 🎨 支持私有化部署配置开关

**健壮性提升**
- 🛡️ try-catch 异常捕获，防止配置错误导致页面崩溃
- 🛡️ 严格的类型检查和格式验证
- 🛡️ 自动清理损坏的 localStorage 数据
- 🛡️ 详细的调试日志输出

#### 🗑️ 删除废弃代码

- ❌ 删除 `src/IM/initwebsdk.js`（已被新架构替代）
- ❌ 删除旧的配置逻辑代码
- ❌ 移除不必要的配置判断分支

#### 📝 文档更新

**README.md**
- ✍️ 添加快速配置指南
- ✍️ 明确配置修改入口
- ✍️ 补充私有化部署说明

**配置文档**
- ✍️ 新增 `src/IM/config/README.md`
- ✍️ 详细的配置项说明和示例
- ✍️ 常见问题解答（FAQ）
- ✍️ 调试信息说明

#### 🔄 文件变更统计

```
13 个文件变更
+12,840 行新增
-1,167 行删除
```

**新增文件**：
- `src/IM/config/README.md` - 配置文档
- `src/IM/config/configLoader.js` - 配置加载器
- `src/IM/sdk/index.js` - SDK 初始化模块

**删除文件**：
- `src/IM/initwebsdk.js` - 废弃的初始化文件
- `src/IM/miniCore/index.js` - 已重命名

**修改文件**：
- `src/IM/config/index.js` - 简化配置结构
- `src/IM/index.js` - 更新 SDK 引用路径
- `src/views/Login/index.vue` - 添加后门功能
- `src/views/Login/components/CustomImConfig/index.vue` - 优化配置弹窗
- `src/views/Login/components/LoginInput/index.vue` - 简化登录逻辑
- `README.md` - 添加配置指南

#### 🎯 使用场景

**场景 1：开发环境快速配置**
```javascript
// 只需修改 src/IM/config/index.js
export const EASEMOB_APPKEY = 'your-org#your-app';
```

**场景 2：私有化部署**
```javascript
export const IS_PRIVATE_DEPLOYMENT = true;
export const EASEMOB_SOCKET_URL = 'wss://your-server.com/ws';
export const EASEMOB_REST_URL = 'https://your-server.com';
```

**场景 3：线上测试**
- 点击版本号 5 次
- 在弹窗中输入测试配置
- 配置仅存储在 localStorage，不影响代码

#### ⚠️ 破坏性变更

- 🔴 目录重命名：`src/IM/miniCore/` → `src/IM/sdk/`
- 🔴 删除了 `src/IM/initwebsdk.js`（如有自定义引用需要更新）
- 🔴 配置文件导出项变更：移除了 `DEFAULT_EASEMOB_SOCKET_URL` 和 `DEFAULT_EASEMOB_REST_URL`

#### 🔗 相关 Commit

- `cb2797b` - refactor: 优化IM配置系统架构

---

## 历史版本

### [0.1.0] - 之前版本

- 基础 Vue3 + 环信 IM 集成
- 支持单聊、群聊
- 集成 EaseCallKit 音视频通话
- 基础消息类型支持

---

## 说明

- **Added（新增）**：用于新增功能
- **Changed（变更）**：用于功能变更
- **Deprecated（弃用）**：用于即将移除的功能
- **Removed（移除）**：用于已移除的功能
- **Fixed（修复）**：用于错误修复
- **Security（安全）**：用于安全相关的修复
