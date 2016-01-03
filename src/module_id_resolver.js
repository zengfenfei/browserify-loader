"use strict";
var url = require('url')
var path = require('path')

var loaderPath = getLoaderPath()
var forceExt = true
var forceDir = true // if name endsWith '/', force it to be a directory

var NODE_MODULES_FOLDER_NAME = 'node_modules'


/* Load order: https://nodejs.org/api/modules.html#modules_all_together

/*
LOAD_AS_FILE(X)
1. If X is a file, load X as JavaScript text.  STOP
2. If X.js is a file, load X.js as JavaScript text.  STOP
3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
4. If X.node is a file, load X.node as binary addon.  STOP

X.node is ignored
*/
function loadAsFile(x, action, tries) {
  if (forceDir && x.endsWith('/')) {
    return Promise.reject('Force to be a directory, since ends with "/"')
  }
  var extensions = ['.js', '.json'];
  var ext = path.extname(x)
  if (forceExt && extensions.indexOf(ext) == -1) {
    //won't load file without valid ext
  } else {
    var p = action(x);
  }

  var i = 0;
  var tryExt = function tryExt(reason) {
    reason && tries.push(reason)
    return action(x + extensions[i++]);
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

var folderModuleCache = {}  // {folder: resolved file id}
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
function loadAsDirectory(x, action, tries) {
  if (folderModuleCache[x]) {
    return loadAsFile(folderModuleCache[x], action, tries)
  }
  return action(path.join(x, 'package.json')).then(function(resp) {
    return resp.body;
  }).then(JSON.parse).catch(function(reason) {
    tries.push(reason)
    return {};
  }).then(function(pkgInfo) {
    var moduleIdInFolder = path.join(x, pkgInfo.main || 'index')
    folderModuleCache[x] = moduleIdInFolder
    return loadAsFile(moduleIdInFolder, action, tries)
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
function loadNodeModules(x, start, action, tries) {
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

  function loadNodeModuleAsFile (reason) {
    reason && tries.push(reason)
    return loadAsFile(nodeModulePaths[j] + x, action, tries)
  }
  function loadNodeModuleAsDirectory (reason) {
    reason && tries.push(reason)
    return loadAsDirectory(nodeModulePaths[j++] + x, action, tries)
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

var coreModules = {
assert: 'assert/',
buffer: 'buffer/',
child_process: '../lib/_empty.js',
cluster: '../lib/_empty.js',
console: 'console-browserify',
constants: 'constants-browserify',
crypto: 'crypto-browserify',
dgram: '../lib/_empty.js',
dns: '../lib/_empty.js',
domain: 'domain-browser',
events: 'events',
fs: '../lib/_empty.js',
http: 'stream-http',
https: 'https-browserify',
module: '../lib/_empty.js',
net: '../lib/_empty.js',
os: 'os-browserify/browser.js',
path: 'path-browserify',
punycode: 'punycode/',
querystring: 'querystring-es3/',
readline: '../lib/_empty.js',
repl: '../lib/_empty.js',
stream: 'stream-browserify',
string_decoder: 'string_decoder/',
sys: 'util/util.js',
timers: 'timers-browserify',
tls: '../lib/_empty.js',
tty: 'tty-browserify',
url: 'url/',
util: 'util',
vm: 'vm-browserify',
zlib: 'browserify-zlib'
}

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
  @param action is the operation performed on each id tried, should return Promise, action(moduleId tried)

*/
function resolve(x, y, action) {
  var coreModule = coreModules[x]
  if (coreModule) { // is core module
    x = coreModule
    y = url.resolve(loaderPath, '../'+NODE_MODULES_FOLDER_NAME + '/browserify/' + NODE_MODULES_FOLDER_NAME+'/')
  } else {
    y = y || location.pathname
    if (!y.endsWith('/')) {
      y = path.dirname(y) + '/'
    }
  }

  var p;
  var fails = []
  if (x.startsWith('./') || x.startsWith('/') || x.startsWith('../')) {
    var absoluteUri = url.resolve(y, x)
    p = loadAsFile(absoluteUri, action, fails).catch(function (reason) {
      fails.push(reason)
      return loadAsDirectory(absoluteUri, action, fails)
    });
  } else {
    p = loadNodeModules(x, y, action, fails)
  }

  return p.then(function (res) {
    res.fails = fails
    return res
  }).catch(function (reason) {
    fails.push(reason)
    throw fails
  });
}

//The browerify loader js path like '/browserify-loader/loader.js'
function getLoaderPath () {
  var loaderJs = url.parse(document.currentScript.src)
  return loaderJs.pathname
}

exports.resolve = resolve
