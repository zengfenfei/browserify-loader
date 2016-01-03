//var xhr = require('xhr')
console.log('Before require')
var Dog = require('./dog')
console.log('After require', Dog)
//var b = require('./bar.js')
console.log('@@@@@ This is module content. this == exports', this == exports, module)
exports.foo = function () {
  console.log('foo')
}

console.log('core module util', require('util'))
