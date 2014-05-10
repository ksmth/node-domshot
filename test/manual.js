'use strict';

var DOMShot = require('../index.js');
var wd      = require('wd');
var browser = wd.remote('localhost', 5555);

browser.init({}, function () {

  var domshot = new DOMShot({
    browser    : browser,
    outputPath : 'output'
  });

  domshot.get('https://github.com', function (err, results) {

    if (err) {
      browser.quit();
      return console.error(err);
    }

    console.log(results);
    browser.quit();

  });

});
