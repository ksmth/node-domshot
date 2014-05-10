'use strict';

var async  = require('async');
var fs     = require('fs');
var url    = require('url');
var Canvas = require('canvas');
var Image  = Canvas.Image;
var mkdirp = require('mkdirp');

function DOMShot(options) {

  if (!options.browser) {
    throw new Error('browser missing');
  }

  this.browser = options.browser;

  if (options.outputPath) {
    this.outputPath = options.outputPath;
  }

  if (options.filename) {
    this.filename = options.filename;
  }

  if (options.path) {
    this.path = options.path;
  }

  if (options.filename) {
    this.filename = options.filename;
  }

}

DOMShot.prototype = {

  get : function (options, callback) {

    var _this = this;

    if (Array.isArray(options)) {

      async.mapSeries(options, function (optionsObj, mapCallback) {

        _this.getOne(optionsObj, mapCallback);

      }, callback);

    } else {

      _this.getOne(options, callback);

    }

  },

  getOne : function (options, callback) {

    var _this = this;

    options = (typeof options === 'string') ? { url : options } : options;

    if (!options.url) {
      return callback(new Error('missing url'));
    }

    if (!options.selectors) {
      options.selectors = ['body'];
    }

    async.auto({

      getUrl : function (autoCallback) {
        _this.browser.get(options.url, autoCallback);
      },

      execute : ['getUrl', function (autoCallback) {

        if (!options.script) {
          return autoCallback();
        }

        _this.browser.execute(options.script, autoCallback);

      }],

      screenshot : ['getUrl', 'execute', function (autoCallback) {
        _this.browser.takeScreenshot(autoCallback);
      }],

      canvas : ['screenshot', function (autoCallback, results) {

        var img = new Image();
        img.src = new Buffer(results.screenshot, 'base64');

        var canvas = new Canvas(img.width, img.height);
        var ctx    = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        autoCallback(null, canvas);

      }],

      elements : ['getUrl', function (autoCallback) {

        async.map(options.selectors, function (selector, mapCallback) {

          _this.browser.elementByCssSelector(selector, function (err, element) {

            mapCallback(err, {
              wdElement : element,
              selector  : selector
            });

          });

        }, autoCallback);

      }],

      addProperties : ['elements', function (autoCallback, results) {

        async.each(results.elements, function (element, eachCallback) {

          function getElementSize(callback) {

            element.wdElement.getSize(function (err, size) {
              element.size = size;
              callback(err, size);
            });

          }

          function getElementLocation(callback) {

            element.wdElement.getLocation(function (err, location) {
              element.location = location;
              callback(err, location);
            });

          }

          async.parallel([getElementSize, getElementLocation], eachCallback);

        }, autoCallback);

      }],

      cutElements : ['addProperties', 'canvas', function (autoCallback, results) {

        async.each(results.elements, function (element, eachCallback) {

          var canvas = element.canvas = new Canvas(element.size.width, element.size.height);
          var ctx    = canvas.getContext('2d');

          ctx.drawImage(results.canvas, -element.location.x, -element.location.y);
          eachCallback();

        }, autoCallback);

      }],

      saveElements : ['cutElements', function (autoCallback, results) {

        if (!_this.outputPath) {
          return autoCallback();
        }

        async.each(results.elements, function (element, eachCallback) {

          var path = _this.outputPath + _this.path(element, options);

          mkdirp(path, function (err) {

            if (err) {
              return autoCallback(err);
            }

            element.filename = _this.filename(element, options);
            element.filepath = path + element.filename;

            fs.writeFile(element.filepath, element.canvas.toBuffer(), eachCallback);

          });

        }, autoCallback);

      }],

      output : ['saveElements', function (autoCallback, results) {

        async.map(results.elements, function (element, mapCallback) {

          var output = {

            selector : element.selector,
            url      : options.url,
            image    : element.canvas.toBuffer(),

            size : {
              width  : element.size.width,
              height : element.size.height
            },

            location : {
              x : element.location.x,
              y : element.location.y
            }

          };

          if (element.filename) {
            output.filename = element.filename;
          }

          if (element.filepath) {
            output.filepath = element.filepath;
          }

          mapCallback(null, output);

        }, autoCallback);

      }]

    }, function (err, results) {

      if (err) {
        return callback(err);
      }

      return callback(null, results.output);

    });

  },

  path : function (element, options) {

    var parsedUrl    = url.parse(options.url);
    var safeSelector = element.selector.replace(/#\s/, '_');
    var safeUrl      = (parsedUrl.hostname + parsedUrl.pathname.replace(/\.[^/.]+$/, '/'))
      .replace(/[^a-z0-9\.\/]/gi, '_')
      .toLowerCase();

    return '/' + safeUrl + safeSelector + '/';

  },

  filename : function (element, options) {

    function pad(number, width) {
      number += '';
      return (number.length >= width) ? number : new Array(width - number.length + 1).join('0') + number;
    }

    var path  = this.outputPath + this.path(element, options);
    var digit = (fs.existsSync(path)) ? fs.readdirSync(path).length + 1 : 1;
    return pad(digit, 5) + '.png';

  }

};

module.exports = DOMShot;
