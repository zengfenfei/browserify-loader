#!/bin/bash

# To project root dir
cd `dirname $0`/..

. scripts/env_setup.sh

outDir=.
mkdir -p $outDir
browserify src/main.js > $outDir/browserify-loader.js
