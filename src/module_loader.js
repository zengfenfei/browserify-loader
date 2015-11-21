"use strict";
var url = require('url')
var xhr = require('xhr')
var path = require('path')

// check resource exists
function loadText(uri) {
  return new Promise(
    function(resolve, reject) {
      xhr(uri, function(err, resp, body) {
        if (err || [200, 304].indexOf(resp.statusCode) == -1) {
          reject(err || `Fail to load ${uri}:${resp.statusCode} ${resp.rawRequest.statusText}`);
        } else {
          resolve(resp); // {url: , body:}
        }
      });
    }
  );
}

/* Load order: https://nodejs.org/api/modules.html#modules_all_together

require(X) from module at path Y
  1. If X is a core module,
     a. return the core module
     b. STOP
  2. If X begins with './' or '/' or '../'
     a. LOAD_AS_FILE(Y + X)
     b. LOAD_AS_DIRECTORY(Y + X)
  3. LOAD_NODE_MODULES(X, dirname(Y))
  4. THROW "not found"

LOAD_AS_FILE(X)
  1. If X is a file, load X as JavaScript text.  STOP
  2. If X.js is a file, load X.js as JavaScript text.  STOP
  3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
  4. If X.node is a file, load X.node as binary addon.  STOP

LOAD_AS_DIRECTORY(X)
  1. If X/package.json is a file,
     a. Parse X/package.json, and look for "main" field.
     b. let M = X + (json main field)
     c. LOAD_AS_FILE(M)
  2. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
  3. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
  4. If X/index.node is a file, load X/index.node as binary addon.  STOP

LOAD_NODE_MODULES(X, START)
  1. let DIRS=NODE_MODULES_PATHS(START)
  2. for each DIR in DIRS:
     a. LOAD_AS_FILE(DIR/X)
     b. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)
  1. let PARTS = path split(START)
  2. let I = count of PARTS - 1
  3. let DIRS = []
  4. while I >= 0,
     a. if PARTS[I] = "node_modules" CONTINUE
     c. DIR = path join(PARTS[0 .. I] + "node_modules")
     b. DIRS = DIRS + DIR
     c. let I = I - 1
  5. return DIRS
  */
function loadCoreModule(uri) {

}

function loadAsFile(x) {
  var p = loadText(x);

  var extensions = ['js', 'json'];
  var i = 0;
  var tryExt = function tryExt(reason) {
    return loadText(x + '.' + extensions[i++]);
  };
  for (var j = 0; j < extensions.length; j++) {
    p = p.catch(tryExt);
  }
  return p;
}

function loadAsDirectory(x) {
  return loadText(x + '/package.json').then(function(resp) {
    return resp.body;
  }).then(JSON.parse).catch(function(reason) {
    return {};
  }).then(function(pkgInfo) {
    return loadAsFile(x + '/' + (pkgInfo.main || 'index'));
  });
}


function loadNodeModules(x, start) {
  var load = loadModule;
  var p = load(start + '/node_modules/' + x, '/')
  while (start != '/') {
    start = path.dirname(start)
    p = p.catch(load.bind(null, start + '/node_modules/' + x, '/'));
  }
  return p
}

/*
      require(X) from module at path Y
      return {file:, content:}
  */
function loadModule(x, y) {
  console.log('loading', x, y)
  if (x.startsWith('./') || x.startsWith('/') || x.startsWith('../')) {
    var absoluteUri = url.resolve(y, x);
    return loadAsFile(absoluteUri).catch(loadAsDirectory.bind(null, absoluteUri));
  } else {
    return loadNodeModules(x, path.dirname(y))
  }
}

window.loadModule = loadModule;
var exports = module.exports = loadModule;
