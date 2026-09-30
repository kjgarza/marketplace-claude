---
name: image-processing
description: >
  Process images using ImageMagick for format conversion, resizing, cropping, batch
  processing, effects, composition, watermarks, and optimization. This skill should be
  used when the user wants to convert image formats (PNG, JPEG, WebP, GIF), resize or
  crop images, apply effects (blur, sharpen, sepia, grayscale), add watermarks or text
  overlays, batch process multiple images, create thumbnails, or optimize images for web.
---

# Image Processing Skill

Process images using ImageMagick command-line tools for conversion, optimization, and manipulation tasks.

## Installation

### macOS
```bash
brew install imagemagick
```

### Ubuntu/Debian
```bash
sudo apt-get install imagemagick
```

### Windows
```bash
winget install ImageMagick.ImageMagick
# Or download: https://imagemagick.org/script/download.php
```

### Verify Installation
```bash
magick -version
# or
convert -version
```

## Quick Start Examples

### Image Processing
```bash
# Convert format
magick input.png output.jpg

# Resize maintaining aspect ratio
magick input.jpg -resize 800x600 output.jpg

# Create square thumbnail
magick input.jpg -resize 200x200^ -gravity center -extent 200x200 thumb.jpg
```

### Batch Image Resize
```bash
# Resize all JPEGs to 800px width
mogrify -resize 800x -quality 85 *.jpg

# Output to separate directory
mogrify -path ./output -resize 800x600 *.jpg
```

### Image Watermark
```bash
# Add watermark to corner
magick input.jpg watermark.png -gravity southeast \
  -geometry +10+10 -composite output.jpg
```

## Common Workflows

### Create Responsive Images
```bash
# Generate multiple sizes
for size in 320 640 1024 1920; do
  magick input.jpg -resize ${size}x -quality 85 "output-${size}w.jpg"
done
```

### Batch Image Optimization
```bash
# Convert PNG to optimized JPEG
mogrify -path ./optimized -format jpg -quality 85 -strip *.png
```

### Image Blur Effect
```bash
# Gaussian blur
magick input.jpg -gaussian-blur 0x8 output.jpg
```

## Advanced Techniques

### Complex Image Pipeline
```bash
# Resize, crop, border, adjust
magick input.jpg \
  -resize 1000x1000^ \
  -gravity center \
  -crop 1000x1000+0+0 +repage \
  -bordercolor black -border 5x5 \
  -brightness-contrast 5x10 \
  -quality 90 \
  output.jpg
```

### Animated GIF from Images
```bash
# Create with delay
magick -delay 100 -loop 0 frame*.png animated.gif

# Optimize size
magick animated.gif -fuzz 5% -layers Optimize optimized.gif
```

## Media Analysis

### Image Information
```bash
# Basic info
identify image.jpg

# Detailed format
identify -verbose image.jpg

# Custom format
identify -format "%f: %wx%h %b\n" image.jpg
```

## Performance Tips

1. **Batch with mogrify** - In-place image processing
2. **Strip metadata** - Reduce file size with `-strip`
3. **Progressive JPEG** - Better web loading with `-interlace Plane`
4. **Limit memory** - Prevent crashes on large batches
5. **Test on samples** - Verify settings before batch
6. **Parallel processing** - Use GNU Parallel for multiple files

## Reference Documentation

Detailed guides in `references/`:

- **imagemagick-editing.md** - Format conversion, effects, transformations
- **imagemagick-batch.md** - Batch processing, mogrify, parallel operations

## Common Parameters

### ImageMagick Geometry
- `800x600` - Fit within (maintains aspect)
- `800x600!` - Force exact size
- `800x600^` - Fill (may crop)
- `800x` - Width only
- `x600` - Height only
- `50%` - Scale percentage

## Troubleshooting

**ImageMagick "not authorized"**
```bash
# Edit policy file
sudo nano /etc/ImageMagick-7/policy.xml
# Change <policy domain="coder" rights="none" pattern="PDF" />
# to <policy domain="coder" rights="read|write" pattern="PDF" />
```

**Memory errors**
```bash
# Limit memory usage
magick -limit memory 2GB -limit map 4GB input.jpg output.jpg
```

## Resources

- ImageMagick: https://imagemagick.org/
- ImageMagick Usage: https://imagemagick.org/Usage/