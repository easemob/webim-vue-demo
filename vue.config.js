const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  productionSourceMap: false,
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    host: 'localhost',
    port: 9001,
    // https:true
  },
  chainWebpack: (config) => {
    //最小化代码
    config.optimization.minimize(true);
    //分割代码
    config.optimization.splitChunks({
      chunks: 'all',
    });
  },
});
