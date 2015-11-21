#!/bin/bash

# To project root dir
cd `dirname $0`/..

. scripts/env_setup.sh

outDir=.
mkdir -p $outDir
watchify src/main.js -o $outDir/browserify-loader.js -v
