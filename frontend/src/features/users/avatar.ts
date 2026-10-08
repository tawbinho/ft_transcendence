import type { ValidationKey } from '@/lib/validation';

// Profile pictures are checked and shrunk in the browser before the upload:
// the server receives a small square picture (and checks type and size again).

export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
/** The largest upload the server accepts. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
/** Larger files are refused before even being opened. */
export const AVATAR_SOURCE_MAX_BYTES = 10 * 1024 * 1024;
/** Width and height of the uploaded picture, in pixels. */
export const AVATAR_SIZE = 256;

export function validateAvatarFile(file: Pick<File, 'type' | 'size'>): ValidationKey | null {
  if (!AVATAR_TYPES.includes(file.type as (typeof AVATAR_TYPES)[number])) return 'validation.avatarType';
  if (file.size > AVATAR_SOURCE_MAX_BYTES) return 'validation.avatarSize';
  return null;
}

/** Crops the middle square of the picture and scales it to AVATAR_SIZE (WebP, or PNG where WebP is not supported). */
export async function shrinkAvatar(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
  if (!blob) throw new Error('The picture could not be encoded');
  return blob;
}
