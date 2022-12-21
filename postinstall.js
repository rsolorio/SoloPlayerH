// Updates browser js config for electron
const fs = require('fs');
const browserJsPath = 'node_modules/@angular-devkit/build-angular/src/webpack/configs/browser.js';
const { getConfigs } = require('./postinstall.config');

const { electronConfig } = getConfigs();
fs.readFile(browserJsPath, 'utf8', function (err, data) {

  if (err) {
    return console.log(err);
  }

  // This will insert the electronConfig portion as part of the webpack configuration of the browser.js
  let result = data.replace(/return {[\s\S]+?$/m, 'return {');
  result = result.replace(/target: "web", /g, '');
  result = result.replace(/return \{/g, 'return {' + electronConfig);

  // Update the file with the changes
  fs.writeFile(browserJsPath, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});
