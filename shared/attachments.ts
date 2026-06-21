export interface Attachment {
  id: number;
  url: string;
  mimeType: string;
  originalName: string;
  size: number;
}

export const MAX_ATTACHMENTS_PER_MESSAGE = 5;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

export function isAllowedUploadMime(mime: string) {
  return ALLOWED_IMAGE_TYPES.has(mime) || ALLOWED_VIDEO_TYPES.has(mime);
}

export function maxBytesForMime(mime: string) {
  return ALLOWED_VIDEO_TYPES.has(mime) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function isImageMime(mime: string) {
  return ALLOWED_IMAGE_TYPES.has(mime);
}
