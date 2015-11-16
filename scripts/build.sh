#!/bin/bash

# To project root dir
cd `dirname $0`/..

. scripts/env_setup.sh

outDir=.
mkdir -p $outDir
browserify -t 6to5ify src/main.js > $outDir/browserify-loader.js && uglifyjs $outDir/browserify-loader.js -o $outDir/browserify-loader.min.js
