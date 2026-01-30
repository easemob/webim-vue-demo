/**
 * IM 配置加载器
 * 
 * 职责:
 * 1. 从多个来源加载配置(localStorage > 配置文件 > 默认值)
 * 2. 验证配置格式的合法性
 * 3. 提供配置降级和容错机制
 * 
 * 配置优先级:
 * - 自定义配置(localStorage): 用于线上测试后门,优先级最高
 * - 配置文件(config/index.js): 开发者修改的主要配置,优先级中等
 * - 默认值: 环信官方默认配置,优先级最低
 */

import {
  EASEMOB_APPKEY,
  IS_PRIVATE_DEPLOYMENT,
  EASEMOB_SOCKET_URL,
  EASEMOB_REST_URL,
} from './index';

// localStorage 存储键名
const CUSTOM_CONFIG_KEY = 'EASEIM_CUSTOM_CONFIG';

// AppKey 格式校验正则
const APPKEY_PATTERN = /^[a-zA-Z0-9-]+#[a-zA-Z0-9-]+$/;

// 环信官方默认服务器地址
const DEFAULT_EASEMOB_SOCKET_URL = '//im-api-v2.easemob.com/ws';
const DEFAULT_EASEMOB_REST_URL = '//a1.easemob.com';

/**
 * 从 localStorage 安全读取自定义配置
 * @returns {Object|null} 配置对象或 null
 */
function loadCustomConfig() {
  try {
    const storageValue = localStorage.getItem(CUSTOM_CONFIG_KEY);
    if (!storageValue) {
      return null;
    }

    const config = JSON.parse(storageValue);
    
    // 严格校验配置格式
    if (!validateCustomConfig(config)) {
      console.warn('[配置加载器] 自定义配置格式无效,已忽略');
      return null;
    }

    console.log('[配置加载器] 成功加载自定义配置');
    return config;
  } catch (error) {
    console.error('[配置加载器] 读取自定义配置失败:', error);
    // 清除损坏的配置
    clearCustomConfig();
    return null;
  }
}

/**
 * 验证自定义配置格式
 * @param {Object} config - 配置对象
 * @returns {boolean} 是否有效
 */
function validateCustomConfig(config) {
  if (!config || typeof config !== 'object') {
    return false;
  }

  // appKey 必须是非空字符串且符合格式
  if (
    typeof config.appKey !== 'string' ||
    config.appKey.trim().length === 0 ||
    !APPKEY_PATTERN.test(config.appKey)
  ) {
    return false;
  }

  // 如果是私有化部署,需要验证服务器地址
  if (config.isPrivate) {
    if (
      (config.imServer && typeof config.imServer !== 'string') ||
      (config.restServer && typeof config.restServer !== 'string')
    ) {
      return false;
    }
  }

  return true;
}

/**
 * 清除 localStorage 中的自定义配置
 */
function clearCustomConfig() {
  try {
    localStorage.removeItem(CUSTOM_CONFIG_KEY);
    console.log('[配置加载器] 已清除损坏的自定义配置');
  } catch (error) {
    // 忽略清除失败
  }
}

/**
 * 从配置文件加载配置
 * @returns {Object} 配置对象
 */
function loadFileConfig() {
  const config = {
    appKey: EASEMOB_APPKEY,
  };

  // 如果启用了私有化部署,添加服务器地址配置
  if (IS_PRIVATE_DEPLOYMENT) {
    config.isHttpDNS = false;
    config.url = EASEMOB_SOCKET_URL || DEFAULT_EASEMOB_SOCKET_URL;
    config.apiUrl = EASEMOB_REST_URL || DEFAULT_EASEMOB_REST_URL;
  }

  console.log('[配置加载器] 使用配置文件');
  return config;
}

/**
 * 构建自定义配置对象
 * @param {Object} customConfig - 自定义配置
 * @returns {Object} SDK 配置对象
 */
function buildCustomConfig(customConfig) {
  const config = {
    appKey: customConfig.appKey,
  };

  if (customConfig.isPrivate) {
    config.isHttpDNS = false;
    config.url = customConfig.imServer || DEFAULT_EASEMOB_SOCKET_URL;
    config.apiUrl = customConfig.restServer || DEFAULT_EASEMOB_REST_URL;
  }

  console.log('[配置加载器] 使用自定义配置(线上测试)');
  return config;
}

/**
 * 加载 IM 配置(主入口)
 * 按优先级依次尝试: 自定义配置 > 配置文件 > 默认值
 * @returns {Object} SDK 配置对象
 */
export function loadIMConfig() {
  // 1. 尝试加载自定义配置
  const customConfig = loadCustomConfig();
  if (customConfig) {
    return buildCustomConfig(customConfig);
  }

  // 2. 降级到配置文件
  return loadFileConfig();
}

/**
 * 导出工具方法供外部使用
 */
export {
  validateCustomConfig,
  clearCustomConfig,
  CUSTOM_CONFIG_KEY,
};
