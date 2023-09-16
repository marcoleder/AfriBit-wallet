#!/bin/bash

./node_modules/.bin/jetify && yarn patch-package
if which pod >/dev/null; then
  cd ios && pod install
fi
