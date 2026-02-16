# QR Code Generation

Instructions for generating QR codes for book club one-pagers and materials.

## Library

Use Python's `qrcode` library with PIL/Pillow for image generation.

### Install

```bash
pip install "qrcode[pil]"
```

## Basic Usage

```python
import qrcode

def generate_qr_code(url, output_path, size=10, border=4):
    """Generate a QR code PNG for the given URL.

    Args:
        url: The URL to encode
        output_path: Where to save the PNG file
        size: Box size in pixels (default 10 = ~330x330px)
        border: Border width in boxes (default 4, minimum per spec)
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=size,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_path)
    return output_path
```

## Recommended Sizes

| Use Case | box_size | Approximate Dimensions |
|----------|----------|----------------------|
| One-pager (embedded) | 8 | ~260x260px |
| Standalone print | 10 | ~330x330px |
| Large poster | 15 | ~500x500px |

## Error Correction

Always use `ERROR_CORRECT_H` (High, ~30% recovery). This ensures the QR code remains scannable even when printed at small sizes or on lower-quality paper.

| Level | Recovery | Use Case |
|-------|----------|----------|
| L | ~7% | Screen display only |
| M | ~15% | Good quality printing |
| Q | ~25% | General purpose |
| **H** | **~30%** | **Recommended — print-safe** |

## Integration with One-Pager

When generating a one-pager:

1. Read `qr_target_url` from `book-profile.json`
2. Generate the QR code:
   ```python
   generate_qr_code(
       url=book_profile["qr_target_url"],
       output_path="bookclub-qr.png",
       size=8
   )
   ```
3. Reference the image in the one-pager Markdown/PDF
4. Add caption: "Scan to get the book"

## Notes

- The QR code should encode the `qr_target_url` from the book profile (typically a Bookshop.org or Goodreads link)
- If no `qr_target_url` is set, fall back to the first available link in `links`
- Test the generated QR code by reading it back (most phone cameras work)
- For PDF generation, the QR PNG can be embedded directly
