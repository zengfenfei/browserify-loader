"use strict";

var resolveModule = require('./module_id_resolver.js').resolve
var xhr = require('xhr')
var path = require('path')

// check resource exists
function loadText(uri) {
  return new Promise(
    function(resolve, reject) {
      //console.log('Xhr loading', uri)
      xhr(uri, function(err, resp, body) {
        if (err || [200, 304].indexOf(resp.statusCode) == -1) {
          reject(uri + ':' + (err || resp.statusCode));
        } else {
          resolve({
            url: resp.url,
            body: resp.body
          }); // {url: , body:}
        }
      })
    }
  )
}

var loading = {} //{uri: promise}
var loaded = {} //{uri: resp}
function loadWithCache(uri) {
  if (loading[uri]) {
    //console.warn('@@@@@Using loading', uri)
    return loading[uri]
  } else if (loaded[uri]) {
    //console.warn('@@@@@Using loaded', uri)
    return Promise.resolve(loaded[uri])
  } else {
    var p = loadText(uri).then(function(resp) {
      delete loading[uri]
      loaded[uri] = resp
      return resp
    })
    loading[uri] = p
    return p
  }
}

exports.load = function(x, y) {
  return resolveModule(x, y, loadWithCache)
}
