---
name: media-processing
description: Process multimedia files with  ImageMagick (image manipulation, format conversion, batch processing, effects, composition). Use when converting media formats, encoding images 
license: MIT
---

# Media Processing Skill

Process images using ImageMagick command-line tools for conversion, optimization, streaming, and manipulation tasks.

## When to Use This Skill

Use when:
- Converting media formats (video, audio, images)
- Encoding video with codecs (H.264, H.265, VP9, AV1)
- Processing images (resize, crop, effects, watermarks)
- Extracting audio from video
- Creating streaming manifests (HLS/DASH)
- Generating thumbnails and previews
- Batch processing media files
- Optimizing file sizes and quality
- Applying filters and effects
- Creating composite images or videos

## Tool Selection Guide


### ImageMagick: Image Processing
Use ImageMagick for:
- Image format conversion (PNG, JPEG, WebP, GIF)
- Resizing, cropping, transformations
- Batch image processing (mogrify)
- Visual effects (blur, sharpen, sepia)
- Text overlays and watermarks
- Image composition and montages
- Color adjustments, filters
- Thumbnail generation

### Decision Matrix

| Task | Tool | Why |
|------|------|-----|
| Image resize | ImageMagick | Optimized for still images |
| Batch images | ImageMagick | mogrify for in-place edits |
| Image effects | ImageMagick | Rich filter library |

## Installation

### macOS
```bash
brew install ffmpeg imagemagick
```

### Ubuntu/Debian
```bash
sudo apt-get install ffmpeg imagemagick
```

### Windows
```bash
# Using winget
winget install ffmpeg
winget install ImageMagick.ImageMagick

# Or download binaries
# FFmpeg: https://ffmpeg.org/download.html
# ImageMagick: https://imagemagick.org/script/download.php
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

1. **Copy streams when possible** - Avoid re-encoding with `-c copy`
2. **Appropriate presets** - Balance speed vs compression
3. **Batch with mogrify** - In-place image processing
4. **Strip metadata** - Reduce file size with `-strip`
5. **Progressive JPEG** - Better web loading with `-interlace Plane`
6. **Limit memory** - Prevent crashes on large batches
7. **Test on samples** - Verify settings before batch
8.  **Parallel processing** - Use GNU Parallel for multiple files

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