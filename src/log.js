"use strict";

var debug = true
module.exports = function () {
  debug && console.log.apply(console, arguments)
}
