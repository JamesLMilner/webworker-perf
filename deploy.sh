#!/bin/bash
cp -r src/* ./docs
npm run build
git add ./docs
git commit -m "Update github pages sites"
git push origin master
