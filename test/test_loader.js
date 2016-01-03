var loaderCases = [{
	name: 'load as a file',
	module: './index.html'
}, {
	name: 'load with js extenstion',
	module: './m'
}, {
	name: 'load with json extenstion',
	module: './obj'
}, {
	name: 'load directory without package.json',
	module: './folder_module'
}, {
	name: 'load as directory with package.json',
	module: './folder_module2'
}, {
	name: 'load folder from node_modules with package.json',
	module: 'fm'
}, {
	name: 'load from node_modules',
	module: 'nm'
}, {
	name: 'load from topper level node_modules',
	module: 'uglifyjs'
}];

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
coreModules.forEach(function (e) {
	loaderCases.push({name: 'load core module:'+e, module:e})
});
loaderCases.forEach(testLoaderCase)

var loader = require('../src/module_loader.js')
function testLoaderCase (c) {
	QUnit.test(c.name, function (assert) {
		var done = assert.async();
		loader.load(c.module, location.pathname).then(function (module) {
			if (module) {
				assert.ok(1, c.module + ' -> '+ module.url + ';\n' + module.fails.join(';\n@'))
			} else {
				assert.ok(0, 'null')
			}
			done()
		}, function (reason) {
			assert.ok(0, reason)
			done()
		})
	});
}
