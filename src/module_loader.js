"use strict";
var url = require('url')
var xhr = require('xhr')
var path = require('path')

var loaderPath = getLoaderPath()
var forceExt = false

var NODE_MODULES_FOLDER_NAME = 'node_modules'

// check resource exists
function loadText(uri) {
  return new Promise(
    function(resolve, reject) {
      //console.log('Xhr loading', uri)
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

 */
function loadCoreModule(uri) {

}

/*
LOAD_AS_FILE(X)
1. If X is a file, load X as JavaScript text.  STOP
2. If X.js is a file, load X.js as JavaScript text.  STOP
3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
4. If X.node is a file, load X.node as binary addon.  STOP

X.node is ignored
*/
function loadAsFile(x) {
  var extensions = ['.js', '.json'];
  var ext = path.extname(x)
  if (forceExt && extensions.indexOf(ext) == -1) {
    //won't load file without valid ext
  } else {
    var p = loadText(x);
  }

  var i = 0;
  var tryExt = function tryExt(reason) {
    return loadText(x + extensions[i++]);
  }
  for (var j = 0; j < extensions.length; j++) {
    if (p) {
      p = p.catch(tryExt);
    } else {
      p = tryExt()
    }

  }
  return p
}

/*
LOAD_AS_DIRECTORY(X)
1. If X/package.json is a file,
   a. Parse X/package.json, and look for "main" field.
   b. let M = X + (json main field)
   c. LOAD_AS_FILE(M)
2. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
3. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
4. If X/index.node is a file, load X/index.node as binary addon.  STOP
*/
function loadAsDirectory(x) {
  return loadText(x + '/package.json').then(function(resp) {
    return resp.body;
  }).then(JSON.parse).catch(function(reason) {
    return {};
  }).then(function(pkgInfo) {
    return loadAsFile(path.join(x, pkgInfo.main || 'index'));
  });
}

/*
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
function loadNodeModules(x, start) {
  var nodeModulePaths = []
  var parts = start.split('/')
  var j = 0 // load parts cursor

  // The first and last part is empty string due to split
  parts.shift()
  parts.pop()

  for (var i = parts.length-1; i >= 0; i--) {
    if (parts[i] == NODE_MODULES_FOLDER_NAME) {
      continue
    }
    var dir = '/' + parts.slice(0, i+1).join('/') + '/'+NODE_MODULES_FOLDER_NAME+'/'
    nodeModulePaths.push(dir)
  }
  //console.log('The module modules path', nodeModulePaths)

  function loadNodeModuleAsFile () {
    return loadAsFile(nodeModulePaths[j] + x)
  }
  function loadNodeModuleAsDirectory () {
    return loadAsDirectory(nodeModulePaths[j++] + x)
  }
  var p
  for (var i = 0; i < nodeModulePaths.length; i++) {
    if (p) {
      p = p.catch(loadNodeModuleAsFile)
    } else {
      p = loadNodeModuleAsFile()
    }
    p = p.catch(loadNodeModuleAsDirectory)
  };
  return p
}

var coreModules = [
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'https',
  'module',
  'net',
  'os',
  'path',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'sys',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'vm',
  'zlib'
]

/*
  resolve({url, body}), resolve(null) if module loaded
  reject otherwise

  1. If X is a core module,
     a. return the core module
     b. STOP
  2. If X begins with './' or '/' or '../'
     a. LOAD_AS_FILE(Y + X)
     b. LOAD_AS_DIRECTORY(Y + X)
  3. LOAD_NODE_MODULES(X, dirname(Y))
  4. THROW "not found"

  @param y can be a file or directory ends with '/'
*/
function loadModule(x, y) {
  if (coreModules.indexOf(x) > -1) { // is core module
    y = url.resolve(loaderPath, NODE_MODULES_FOLDER_NAME + '/')
  } else {
    y = y || location.pathname
    if (!y.endsWith('/')) {
      y = path.dirname(y) + '/'
    }
  }

  if (x.startsWith('./') || x.startsWith('/') || x.startsWith('../')) {
    var absoluteUri = url.resolve(y, x)
    return loadAsFile(absoluteUri).catch(loadAsDirectory.bind(null, absoluteUri));
  } else {
    return loadNodeModules(x, y)
  }
}

//The browerify loader js path like '/browserify-loader/loader.js'
function getLoaderPath () {
  var loaderJs = url.parse(document.currentScript.src)
  return loaderJs.pathname
}


window.loadModule = loadModule;
exports.load = loadModule
