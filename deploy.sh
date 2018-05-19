#!/bin/bash
cp -r src/* ./docs
git add ./docs
git commit -m "Update github pages sites"
git push origin master
