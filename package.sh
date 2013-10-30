#!/bin/bash
zip -r kmonad-`date +%d-%m-%y`.kwinscript ./* -x './package.sh' './*.kwinscript'
