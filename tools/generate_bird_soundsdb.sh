#!/bin/bash
# By: David Choo
# Encode all bird sounds with opus to save space.
# For each selected bird sound, convert the opus file to Base64 and place
# it into a Javascript object with the filename as the key. This object is
# exported into "bird-sounds-db.js" and exposed in the "birdSounds" variable.

# This Javascript file can then be loaded in the browser to access the raw
# audio files without hosting a webserver, NodeJS, or Electron.

# The sound files should be located in a folder called "ALLBIRDS" relative to the
# script's location. Opus encoded audio files are placed into "CompressedALLBIRDS".

# Requires ffmpeg
# Requires parallel
# Tange, O. (2021, October 22). GNU Parallel 20211022 ('Sinclair').
# Zenodo. https://doi.org/10.5281/zenodo.5593566

mkdir -vp ./CompressedALLBIRDS
# Compress all birds
# Comment the following command and uncomment lines 27-34 to get a subset of bird calls
find ./ALLBIRDS -type f -exec basename {} \; | parallel \
     'ffmpeg -n -i "./ALLBIRDS/{}" -c:a libopus -ac 1 -b:a 20K -vbr constrained $(echo "./CompressedALLBIRDS/{}" | sed "s:mp3:opus:")'

# Select audio files with A, B, or C quality with only a call or a song.
# Then sort by english name and file id ascending
# good_entires=$(cat cleaned.csv | grep -P ',[ABC],' | grep -P ',(call|song),' | sort -t, -k2,2 -k1,1n)
# all_bird_types=$(awk -F, '{print $2}' <<< $good_entires | uniq)
# echo "$all_bird_types"  | while read type; do
#     # Select the first 10 files for the bird type and convert them to opus
#     # mono channel with 12kbps bitrate
#     echo "$good_entires" | grep -P ",$type," | head -10 | awk -F, '{print $2 "-" $1 ".mp3"}' | tr ' ' '-' | sed -e 's:-b:-B:' -e 's:-tip:-Tip:' -e 's:-crest:-Crest:' | parallel \
#     'ffmpeg -n -i "./ALLBIRDS/{}" -c:a libopus -ac 1 -b:a 20K -vbr constrained $(echo "./CompressedALLBIRDS/{}" | sed "s:mp3:opus:")'
# done

echo "let birdSounds = {" > ./bird-sounds-db.js
find ./CompressedALLBIRDS/ -type f -exec basename {} \; | sed 's:jpg:opus:' | parallel 'echo "\"$(echo {} | sed -e "s:.*-::" -e "s:.opus::")\": \"$(base64 -w 0 ./CompressedALLBIRDS/{})\","' >> ./bird-sounds-db.js
echo "};" >> ./bird-sounds-db.js
