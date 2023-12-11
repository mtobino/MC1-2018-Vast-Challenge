#!/bin/bash
# By: David Choo
# Compile KissFFT with Emscripten 2.0.31 into WebAssembly so that it can be used
# in Javascript

git clone git@github.com:mborgerding/kissfft.git
pushd kissfft
rm -r ./build ./install
mkdir build
mkdir install
install_dir="$(pwd)/install"

emmake make --trace CFLAGS="-O3" PREFIX="$install_dir" KISSFFT_TOOLS=0 install
popd

emcc -O3 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="KissFFTModule" \
    -s EXPORTED_FUNCTIONS="['_kiss_fftr_alloc','_kiss_fftr','_kiss_fftri','_kiss_fft_alloc','_kiss_fft','_malloc','_free']" \
    -s SINGLE_FILE=1 \
    -s DYNAMIC_EXECUTION=0 \
    -s ENVIRONMENT="web,webview,worker" \
    -o kissfft-tmp.js "$install_dir/lib/libkissfft-float.so"

echo "/*" > kissfft.js
cat ./kissfft/COPYING >> kissfft.js
echo "*/" >> kissfft.js
cat ./kissfft-tmp.js >> kissfft.js
rm ./kissfft-tmp.js
