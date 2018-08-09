#!/bin/bash

declare -r TARGET_DIR="img"

mkdir -p $TARGET_DIR

for file in ./flowcharts/*.dot; do
    if [ -f "$file" ]; then
        echo "Converting $file"
        outfile=$(basename -s ".dot" $file)
        dot -Tpng -o "$TARGET_DIR/${outfile}.png" $file
    fi
done