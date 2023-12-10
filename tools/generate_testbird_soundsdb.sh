#!/bin/bash
# By: David Choo
# Encode the test bird sounds with opus to save space.
# The opus file is convereted to Base64 and placed into a Javascript object
# with the filename as the key. This object is exported into "test-bird-sounds-db.js"
# and exposed in the "testBirdSounds" variable.

# This Javascript file can then be loaded in the browser to access the raw
# audio files without hosting a webserver, NodeJS, or Electron.

# The sound files should be located in a folder called "Test Birds from Kasios"
# relative to the script's location. Opus encoded audio files are placed into
# "CompressedTestBirds".

# Requires ffmpeg
# Requires parallel
# Tange, O. (2021, October 22). GNU Parallel 20211022 ('Sinclair').
# Zenodo. https://doi.org/10.5281/zenodo.5593566

mkdir -vp ./CompressedTestBirds
# Compress testbirds
find "./Test Birds from Kasios" -type f -exec basename {} \; | parallel \
     'ffmpeg -n -i "./Test Birds from Kasios/{}" -c:a libopus -ac 1 -b:a 20K -vbr constrained $(echo "./CompressedTestBirds/{}" | sed "s:mp3:opus:")'

echo "let testBirdSounds = {" > ./test-bird-sounds-db.js
find ./CompressedTestBirds -type f -exec basename {} \; | sed 's:jpg:opus:' | parallel 'echo "\"$(echo {} | sed -e "s:.*-::" -e "s:.opus::")\": \"$(base64 -w 0 ./CompressedTestBirds/{})\","' >> ./test-bird-sounds-db.js
echo "};" >> ./test-bird-sounds-db.js
