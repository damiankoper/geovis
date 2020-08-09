// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  transpileDependencies: ["vuetify"],
  chainWebpack: config => {
    config.resolve.symlinks(false);
  },
  configureWebpack: {
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "node_modules/geo-vis-engine/dist/img", to: "js/img" },
          { from: "node_modules/geo-vis-engine/dist/models", to: "js/models" },
          {
            from: "node_modules/geo-vis-engine/dist/*.worker.js",
            to: "js",
            flatten: true
          }
        ]
      })
    ]
  }
};
