/**
 * getConfigs that contains a couple of string configs for electron-renderer and web.
 */
const extraWebpackConfig = require('./extra-webpack.config.js');

module.exports.getConfigs = function () {
  extraWebpackConfig.target = 'electron-renderer';
  // Stringify config, without start and ending brackets,
  // plus a comma since it will be later inserted in the browser.js config
  electronConfig = JSON.stringify(extraWebpackConfig).slice(1, -1) + ',';

  extraWebpackConfig.target = 'web';
  // Stringify config, without start and ending brackets,
  // plus a comma since it will be later inserted in the browser.js config
  webConfig = JSON.stringify(extraWebpackConfig).slice(1, -1) + ',';

  return {
    electronConfig,
    webConfig
  };
};
