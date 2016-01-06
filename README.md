browserify-loader
=================

A CommonJS Loader for browserify workflow.


## What is browserify-loader

`browserify-loader` is another CommonJS loader for  browserify workflow. With BL, You don’t need  any tools  like watchify, browserify-middleware to auto build and serve bundle *js in development env.

`browserify-loader` is similar  with [requirejs](http://requirejs.org/), but:

- Follow [module loading algorithm](https://nodejs.org/api/modules.html#modules_all_together)
- get rid of wrapper code like `define()`
- be compatible all `npm` package  and  all `bower` components witch support `CommonJS`. like `underscore`, `backbone`, `jQuery` and so on.

## Getting started

### Install

Download `browserify-loader`  with `npm`:

```bash
$ npm install browserify-loader2
```

Put  `browserify-loader.min.js` in your page:

```html
<!DOCTYPE html>
<html>
<head>
  <title></title>
</head>
<body>
    <script main="./app.js" src="node_modules/browserify-loader2/out/browserify-loader.min.js"></script>
</body>
</html>
```

Then, `browserify-loader` will start to run for `main` file in your `package.json` file.

### Options

- **main**: the main entrance script like `app.js` in `node app.js`
-  **defineName**:  The name of the define function. *Not supported yet*.
- **forceExt**: Force loading files with valid extensions only, ignore files with invalid extenstion. *Not supported yet*.
- **forceDir**:  Force path which ends with `/` to be a directory module. *Not supported yet*.

## Example

Look into `example/index.html`.

## Tests
The module loader has test cases written in Qunit, open `test/index.html`.
