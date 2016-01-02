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
}, {
	name: 'load core module',
	module: 'events'
}];
loaderCases.forEach(testLoaderCase)

function testLoaderCase (c) {
	QUnit.test(c.name, function (assert) {
		var done = assert.async();
		loadModule(c.module, location.pathname).then(function (module) {
			assert.ok(1, c.module + ' -> '+ module.url)
			done()
		}, function (reason) {
			assert.ok(0, reason)
			done()
		})
	});
}
