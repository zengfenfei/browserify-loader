"use strict";

/*var xhr = require('xhr')
var Module = require('./module')
var url = require('url')
var to5Transform = require('6to5/lib/6to5/transformation/transform')
var loadModule = require('./module_loader')

Module.registerExtension('js', (script) => script)

Module.registerExtension('6.js', function(script) {
  return to5Transform(script, {modules: "common", blacklist: ["react"]}).code
})

Module.registerExtension('json', (script) => `module.exports = ${script}`)

Module.registerExtension('jsx', function(script) {
  return to5Transform(script, {modules: "common"}).code
})

define = window.define = Module.define
define.performance = Module.performance
define.registerExtension = Module.registerExtension

function createMainModule(uri, from) {
  var mainModule = new Module(uri, from)
}*/

var module = require('./module.js');

function loadAndDefineModules (mainModulePath) {
  //console.log('Loading mainModule ', mainModulePath);
  module.load(mainModulePath).then(function(m) {
    console.log('loaded', m)
    m.execute()
  }, function(err) {
    console.error('Fail to load mainModule', err)
  });
}


/*
 Excecute module process:
 1. Load the main module file and define main module
 2. Load all dependencies recursively and define each module
 3. excute main moodule
*/
function bootstrap() {
  performance.mark('bootstrap_start')
  var blScript = document.currentScript || document.getElementById('bl-script')
  var mainModule = blScript.getAttribute('main') || './';

  loadAndDefineModules(mainModule);
}

bootstrap()
