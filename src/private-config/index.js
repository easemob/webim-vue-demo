//阿里云短信验证配置
//从环境变量读取配置，确保敏感信息不会被提交到仓库
//请在项目根目录创建 .env.local 文件并配置相应的环境变量

// 开发环境下输出配置验证信息
if (process.env.NODE_ENV === 'development') {
  console.log('========== 环境变量配置验证 ==========');
  console.log('SCENE_ID:', process.env.VUE_APP_SCENE_ID || '未设置');
  console.log('PREFIX:', process.env.VUE_APP_PREFIX || '未设置');
  console.log('SECRET:', process.env.VUE_APP_SECRET ? '已设置(已隐藏)' : '未设置');
  console.log('====================================');
}

export const SCENE_ID = process.env.VUE_APP_SCENE_ID || '';
export const PREFIX = process.env.VUE_APP_PREFIX || '';
export const secret = process.env.VUE_APP_SECRET || '';
