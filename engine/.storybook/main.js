
const path = require("path");
const webpackConfig = require("@vue/cli-service/webpack.config.js");
module.exports = {
  stories: ["../stories/**/*.stories.(ts|tsx)"],
  addons: [
    "@storybook/addon-actions",
    "@storybook/addon-links",
    "@storybook/addon-knobs",
    "@storybook/preset-typescript",
  ],
  webpackFinal: (config) => {
    return {
      ...config,
      module: { ...config.module, rules: webpackConfig.module.rules },
      resolve: {
        ...config.resolve,
        alias: {
          "@": path.join(__dirname, "../src"),
          vue$: "vue/dist/vue.esm.js",
        },
      },
    };
  },
};