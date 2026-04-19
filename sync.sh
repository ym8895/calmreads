#!/bin/bash
# Script to create a lightweight zip of only the source files that changed
# Run this on the server, download the zip to your Windows machine, extract over your project

cd /home/z/my-project

echo "Packaging source files for sync..."

# Create a zip with ONLY source code (no node_modules, .next, etc.)
# This is ~50KB instead of the full ~200MB project folder
zip -r /home/z/my-project/download/softscroll-sync.zip \
  src/ \
  public/ \
  next.config.ts \
  tsconfig.json \
  package.json \
  bun.lockb \
  .gitignore \
  tailwind.config.ts \
  postcss.config.mjs \
  -x "*.log" \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".git/*"

FILESIZE=$(du -h /home/z/my-project/download/softscroll-sync.zip | cut -f1)
echo ""
echo "Done! Sync package created:"
echo "  /home/z/my-project/download/softscroll-sync.zip ($FILESIZE)"
echo ""
echo "On your Windows machine:"
echo "  1. Download softscroll-sync.zip"
echo "  2. Extract it over your existing project folder (E:\\Projects\\Zai\\CalmReads\\softscroll)"
echo "  3. Run: bun install  (only if package.json changed)"
echo "  4. Run: bunx next dev"
