# DOMShot

## Installation

```
npm install domshot
```

## Usage

```
var DOMShot = require('domshot');
var wd      = require('wd');
var browser = wd.remote('localhost', 5555);

browser.init({}, function () {

  var domshot = new DOMShot({
    browser : browser
  });

  domshot.get('https://github.com', function (err, results) {
    console.log(results);
    browser.quit();
  });

});
```

## API

### new DOMShot(*options*)

The constructor returns a new `domshot` instance. It uses the provided `browser` to navigate to the websites. The `browser` will not be altered in any other way and should be usable after `domshot` is finished.

#### options

If you don't specify an `outputPath` in the options object, no files will be created and you have to use the image buffers of the elements returned by the `get` method.

- *browser* - **object**: `wd` browser instance
- *outputPath* - **string** (optional): Base path where images will be stored. default: `undefined`
- *path* - **function (element, options)** (optional): The result is appended to `outputPath`.
- *filename* - **function (element, options)** (optional): The result is appended to `outputPath` after `path(element, options)`.

### domshot.get(*options*, *callback*)

#### options

- *url* - **string**: The target URL
- *selectors* - **array** (optional): CSS selectors of elements to be captured. default: `['body']`

#### result

```
[
  {
    selector : ...,
    url      : ...,
    image    : ..., // image buffer
    filename : ..., // only present if outputPath is set
    filepath : ..., // only present if outputPath is set

    size : {
      width  : ...,
      height : ...
    },

    location : {
      x : 0,
      y : 0
    }
  },
  ...
]
```

### domshot.get(*url*, *callback*)

Shorthand for `domshot.get({ url : url }, callback)`

### domshot.get(*optionsArray*, *callback*)

Another shorthand. `optionsArray` contains multiple `options` objects suitable for `domshot.get(options, callback)`.
