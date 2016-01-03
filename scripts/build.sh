#!/bin/bash

# To project root dir
cd `dirname $0`/..

. scripts/env_setup.sh

outDir=./out
mkdir -p $outDir
browserify src/main.js > $outDir/browserify-loader.js && uglifyjs $outDir/browserify-loader.js -o $outDir/browserify-loader.min.js

echo =========Build Finish==========
