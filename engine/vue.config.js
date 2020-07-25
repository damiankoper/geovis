module.exports = {
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    storybook: {
      allowedPlugins: ["VuetifyLoaderPlugin"],
    },
  },
  chainWebpack: (config) => {
    // GraphQL Loader
    config.module
      .rule("shaders")
      .test(/\.(glsl|vs|fs)$/)
      .use("ts-shader-loader")
      .loader("ts-shader-loader")
      .end();
  },
};
