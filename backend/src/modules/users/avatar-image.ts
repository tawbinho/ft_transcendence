// WHY THIS FILE EXISTS
// The browser says what a file is ("Content-Type: image/png"), but that is
// only a claim, and a client can lie. This looks at the first bytes of the
// file itself (its "magic number") to find out what it REALLY is. Pure: no
// file system, no Nest, easy to test.

export interface ImageType {
  ext: 'webp' | 'png' | 'jpg';
}

export function detectImageType(buffer: Buffer): ImageType | null {
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { ext: 'png' };
  }
  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { ext: 'jpg' };
  }
  // WebP: "RIFF", then 4 bytes of size, then "WEBP"
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { ext: 'webp' };
  }
  return null;
}
