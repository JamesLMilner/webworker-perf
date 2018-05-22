#!/bin/bash
cp src/webworker-stringify.js ./docs/webworker-stringify.js
cp src/worker.js ./docs/worker.js
npm run build
git add ./docs
git commit -m "Update github pages sites"
git push origin master
