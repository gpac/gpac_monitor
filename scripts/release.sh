#!/bin/bash
# Script to create a new release of index.html (standalone)
pnpm run build
cp -f dist/index.html release/index.html
if [ $? -ne 0 ]; then
    echo "Failed to copy index.html to release directory"
    exit 1
fi

echo "Release created at release/index.html"
