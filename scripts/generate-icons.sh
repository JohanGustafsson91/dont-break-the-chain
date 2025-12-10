#!/bin/bash
# Script to generate PWA icons from SVG source
# Uses macOS qlmanage to render SVG, then ImageMagick to resize

set -e

SVG_FILE="./public/icon.svg"
OUTPUT_DIR="./public"
TEMP_DIR="/tmp"

if ! command -v magick &> /dev/null; then
    echo "Error: ImageMagick is not installed"
    echo "Install with: brew install imagemagick"
    exit 1
fi

echo "Generating PWA icons from $SVG_FILE..."

# First render SVG to PNG at high resolution using macOS QuickLook
qlmanage -t -s 1024 -o "$TEMP_DIR/" "$SVG_FILE" > /dev/null 2>&1
TEMP_PNG="$TEMP_DIR/icon.svg.png"

# Generate 192x192 icon
magick "$TEMP_PNG" -resize 192x192 "$OUTPUT_DIR/web-app-manifest-192x192.png"
echo "✓ Generated 192x192 icon"

# Generate 512x512 icon
magick "$TEMP_PNG" -resize 512x512 "$OUTPUT_DIR/web-app-manifest-512x512.png"
echo "✓ Generated 512x512 icon"

# Generate favicon
magick "$TEMP_PNG" -resize 32x32 "$OUTPUT_DIR/favicon.ico"
echo "✓ Generated favicon"

# Generate apple touch icon
magick "$TEMP_PNG" -resize 180x180 "$OUTPUT_DIR/apple-touch-icon.png"
echo "✓ Generated Apple touch icon"

# Clean up temp file
rm -f "$TEMP_PNG"

echo ""
echo "All icons generated successfully!"
