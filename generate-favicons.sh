#!/bin/bash

# Script to generate favicon files from full-icon.png
# Requires ImageMagick (convert command)

set -e

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it first."
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    exit 1
fi

# Check if source file exists
SOURCE_FILE="public/full-icon.png"
if [ ! -f "$SOURCE_FILE" ]; then
    echo "Error: Source file '$SOURCE_FILE' not found"
    exit 1
fi

echo "Generating favicon files from $SOURCE_FILE..."

# Navigate to public directory
cd public

# Generate PNG favicons in various sizes
echo "  Creating favicon-32x32.png..."
convert full-icon.png -resize 32x32 favicon-32x32.png

echo "  Creating favicon-16x16.png..."
convert full-icon.png -resize 16x16 favicon-16x16.png

echo "  Creating android-chrome-192x192.png..."
convert full-icon.png -resize 192x192 android-chrome-192x192.png

echo "  Creating android-chrome-512x512.png..."
convert full-icon.png -resize 512x512 android-chrome-512x512.png

echo "  Creating apple-touch-icon.png..."
convert full-icon.png -resize 180x180 apple-touch-icon.png

# Generate multi-size .ico file
echo "  Creating favicon.ico (multi-size)..."
convert full-icon.png -define icon:auto-resize=16,32,48,64,256 favicon.ico

cd ..

echo "✓ All favicon files generated successfully!"
echo ""
echo "Generated files:"
echo "  - favicon.ico (16, 32, 48, 64, 256px)"
echo "  - favicon-16x16.png"
echo "  - favicon-32x32.png"
echo "  - apple-touch-icon.png (180x180)"
echo "  - android-chrome-192x192.png"
echo "  - android-chrome-512x512.png"