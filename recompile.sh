#!/bin/bash

"$SNELLEN_BASE/external/closure/bin/calcdeps.py" \
    -i "tugofwar.js" \
    -p "$SNELLEN_BASE/external/closure/" \
    --output_file "tugofwar-compiled.js" \
    -o compiled \
    -c "$SNELLEN_BASE/external/closure-compiler.jar" \
    -f '--compilation_level' -f 'ADVANCED_OPTIMIZATIONS' \
    -f '--externs' -f "externs.js" \
    -f '--rename_variable_prefix' -f 'S'
