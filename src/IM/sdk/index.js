/**
 * 环信 IM SDK 初始化模块
 * 
 * 职责:
 * 1. 初始化 MiniCore SDK 实例
 * 2. 注册必需的插件(联系人、群组、在线状态、本地缓存)
 * 3. 导出可用的 SDK 实例
 * 
 * 注意:
 * - 该模块在应用启动时自动执行初始化
 * - 配置加载逻辑已独立到 config/configLoader.js
 * - 插件注册顺序不可随意调整
 */

import MiniCore from 'easemob-websdk/miniCore/miniCore';
import * as contactPlugin from 'easemob-websdk/contact/contact';
import * as groupPlugin from 'easemob-websdk/group/group';
import * as presencePlugin from 'easemob-websdk/presence/presence';
import * as localCachePlugin from 'easemob-websdk/localCache/localCache';
import { loadIMConfig } from '../config/configLoader';

let miniCore = {};

/**
 * 初始化环信 IM SDK
 * @returns {Object} MiniCore 实例
 */
const initEMClient = () => {
  // 加载配置(优先级: localStorage > 配置文件 > 默认值)
  const configOptions = loadIMConfig();

  console.log('[SDK初始化] 最终配置:', configOptions);

  // 创建 SDK 实例
  miniCore = new MiniCore(configOptions);
  
  return miniCore;
};

// 执行初始化
initEMClient();

// 注册插件
if (Object.keys(miniCore).length) {
  miniCore.usePlugin(contactPlugin);        // 联系人管理
  miniCore.usePlugin(groupPlugin);          // 群组管理
  miniCore.usePlugin(presencePlugin);       // 在线状态
  miniCore.usePlugin(localCachePlugin, 'localCache'); // 本地缓存
  
  console.log('[SDK初始化] 插件注册完成');
}

export default miniCore;
