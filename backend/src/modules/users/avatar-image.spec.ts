import { detectImageType } from './avatar-image.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([1, 2, 3, 4]),
  Buffer.from('WEBPVP8 '),
]);

describe('detectImageType', () => {
  it('recognises PNG, JPEG and WebP by their first bytes', () => {
    expect(detectImageType(PNG)).toEqual({ ext: 'png' });
    expect(detectImageType(JPEG)).toEqual({ ext: 'jpg' });
    expect(detectImageType(WEBP)).toEqual({ ext: 'webp' });
  });

  it('refuses other formats, even when the browser would call them images', () => {
    expect(detectImageType(Buffer.from('GIF89a......'))).toBeNull();
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(detectImageType(Buffer.from('<html><script>alert(1)</script>'))).toBeNull();
  });

  it('refuses a RIFF file that is not WebP (a WAV sound, for example)', () => {
    const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WAVEfmt ')]);
    expect(detectImageType(wav)).toBeNull();
  });

  it('refuses empty and tiny files without crashing', () => {
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
    expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});
