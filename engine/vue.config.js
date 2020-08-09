module.exports = {
  transpileDependencies: ["vuetify"],
  publicPath: "/",
  pluginOptions: {
    storybook: {
      allowedPlugins: ["VuetifyLoaderPlugin"],
    },
  },
  css: { extract: false },
  chainWebpack: (config) => {
    config.module
      .rule("shaders")
      .test(/\.(glsl|vs|fs)$/)
      .use("ts-shader-loader")
      .loader("ts-shader-loader")
      .end();

    const svgRule = config.module.rule("svg");
    svgRule.uses.clear();
    svgRule
      .test(/\.svg$/)
      .use("svg-url-loader")
      .loader("svg-url-loader");

    config.module
      .rule("obj")
      .test(/\.(obj)$/)
      .use("file-loader")
      .loader("file-loader")
      .options({ outputPath: "models" })
      .end();

    config.externals([
      function (context, request, callback) {
        if (/^three/.test(request)) {
          return callback(null, request);
        }
        callback();
      },
      "vuetify",
      "moment",
      "lodash",
    ]);
  },
};
