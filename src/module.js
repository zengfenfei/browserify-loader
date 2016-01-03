"use strict";

var path = require('path')
var parseDependencies = require('searequire')
var loadAModule = require('./module_loader.js').load

//https://nodejs.org/api/modules.html#modules_the_module_object
function Module(id) {
  this.id = id;
  this.exports = null; // defined when executed, will only define once
  this.factory = null; // The function passed to define
  this.children = []; // The dependent modules
  this.dependencies = {}; // {requirePath: module}
  //this.scriptEl = null;

  Module.modules[id] = this;
}

Module.prototype.execute = function() {
  var self = this
  if (this.exports) {
    //console.warn('Using cached exports for ' + self.id)
    return this.exports
  }
  this.require = function(path) {
    var dep = self.dependencies[path]
    if (dep) {
      return dep.execute()
    } else {
      //console.warn('Dependeny %s not load properly for ' + self.id, path)
    }
  }
  this.exports = {}
  try {
    this.factory.call(this.exports, this.require, this.exports, this)
  } catch (e) {
    console.error('Error of module' + this.id, e)
  }
  return this.exports
};

function defineModule(content, id) {
  var module = Module.modules[id]
  if (module) {
    //console.warn('Using defined module for ' + id)
    return Promise.resolve(module)
  } else {
    module = new Module(id)
  }
  var ext = path.extname(id).substr(1)
  var source = content
  if (sourceTransforms[ext]) {
    source = sourceTransforms[ext](source)
  }
  var code = Module.defineFuncName + '("' + id + '", function(require, exports, module) {' +
    source + '})\n' +
    '//# sourceURL=' + id;

  var scriptNode = document.createElement('script')
  scriptNode.innerHTML = code
  document.body.appendChild(scriptNode)
  if (module.factory instanceof Function) {
    //scriptNode.remove()
    return loadDependencies(content, id, module).then(function(children) {
      return module
    })
  } else {
    throw new Error('Please check the syntax error of module ' + id)
  }
}

function define(id, factory) {
  Module.modules[id].factory = factory;
}

function loadDependencies(source, from, module) {
  var dependencies = parseDependencies(source);
  var promises = []
  for (var i = 0; i < dependencies.length; i++) {
    var modulePath = dependencies[i].path;
    promises.push(loadADenpendency(modulePath, from, module))
  }
  return Promise.all(promises)
}

function loadADenpendency(requirePath, from, module) {
  return exports.load(requirePath, from).catch(function(err) {
    console.warn('Load dependeny ' + requirePath + ' for ' + from + ' failed.', err)
    return null
  }).then(function(dep) {
    module.dependencies[requirePath] = dep
    module.children.push(dep)
  })
}
var sourceTransforms = {
  json: function(src) {
    return 'module.exports=' + src
  }
}

/*
  {id: new Module}
*/
Module.modules = {}
Module.defineFuncName = 'define'
  // Module.coreModules = {}
  // Module._extensions = {}
  // Module.loadPromises = {}
window[Module.defineFuncName] = define
Module.registerExtension = function(ext, transform) {
  if (sourceTransforms[ext]) {
    console.error('Duplicate transform for ' + ext)
    return
  }
  sourceTransforms[ext] = transform
}

/**
  fulfill(module), module may be null
*/
exports.load = function(uri, from) {
  return loadAModule(uri, from).then(function(res) {
    if (!res) {
      console.warn('Resolved but no res', uri, from)
      return null
    }
    return defineModule(res.body, res.url)
  }).catch(function (fails) {
    console.warn('load ', uri, ' failed', fails)
  })
}
