// WHY THIS FILE EXISTS
// Allowed values of the users routes in one place, shared by the validation
// (DTO) and the service.

// How the Players page can order its list:
//  name    A to Z
//  wins    most wins first, then by name
//  newest  newest account first
export const USER_SORTS = ['name', 'wins', 'newest'] as const;
export type UserSort = (typeof USER_SORTS)[number];

// A display name: 3 to 20 letters of any language (Arabic, French accents...),
// digits, _ and -. Shared by signup and by renaming, so the rules cannot drift.
export const DISPLAY_NAME_MIN = 3;
export const DISPLAY_NAME_MAX = 20;
export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}_-]+$/u;

// Profile pictures. The app shrinks them to 256 x 256 before sending, so
// 2 MB is very generous (the proxy accepts bodies up to 5 MB).
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
// Pictures are served under /api (the proxy only forwards /api and /socket.io).
export const AVATAR_URL_PREFIX = '/api/avatars/';
// What a stored file name looks like: a random uuid and the extension. Checked
// before reading a file from disk, so a name can never point outside the folder.
export const AVATAR_FILE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|png|jpg)$/;
// Upload and rename are limited per minute per address.
export const PROFILE_WRITE_LIMIT_PER_MINUTE = 10;
