#!/bin/bash
# Script to generate PWA icons from SVG source
# Requires ImageMagick: brew install imagemagick

set -e

SVG_FILE="./public/icon.svg"
OUTPUT_DIR="./public"

if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed"
    echo "Install with: brew install imagemagick"
    exit 1
fi

echo "Generating PWA icons from $SVG_FILE..."

# Generate 192x192 icon
convert -background none "$SVG_FILE" -resize 192x192 "$OUTPUT_DIR/web-app-manifest-192x192.png"
echo "✓ Generated 192x192 icon"

# Generate 512x512 icon
convert -background none "$SVG_FILE" -resize 512x512 "$OUTPUT_DIR/web-app-manifest-512x512.png"
echo "✓ Generated 512x512 icon"

# Generate favicon
convert -background none "$SVG_FILE" -resize 32x32 "$OUTPUT_DIR/favicon.ico"
echo "✓ Generated favicon"

# Generate apple touch icon
convert -background none "$SVG_FILE" -resize 180x180 "$OUTPUT_DIR/apple-touch-icon.png"
echo "✓ Generated Apple touch icon"

echo ""
echo "All icons generated successfully!"
