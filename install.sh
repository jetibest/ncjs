#!/bin/sh

sudo cp "$(dirname "$(realpath -s "$0")")/index.js" /usr/local/bin/ncjs
