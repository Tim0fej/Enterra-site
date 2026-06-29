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

/** Подсказка под кнопкой загрузки вложений (тикеты, форум). */
export const ATTACHMENT_UPLOAD_HINT =
  `До ${MAX_ATTACHMENTS_PER_MESSAGE} файлов: фото JPG, PNG, GIF, WebP — до 10 МБ; ` +
  'видео MP4, WebM, MOV — до 50 МБ. HEIC с iPhone не поддерживается — сохраните как JPG.';

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

const EXTENSION_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jpe': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

/** Нормализует MIME от браузера или угадывает по расширению (Windows часто шлёт octet-stream). */
export function normalizeUploadMime(mime: string, filename: string): string | null {
  const lower = mime.toLowerCase().split(';')[0].trim();
  if (lower === 'image/jpg') return 'image/jpeg';
  if (isAllowedUploadMime(lower)) return lower;

  if (
    !lower ||
    lower === 'application/octet-stream' ||
    lower === 'binary/octet-stream' ||
    lower === 'application/x-msdownload'
  ) {
    const fromExt = EXTENSION_MIME[fileExtension(filename)];
    return fromExt && isAllowedUploadMime(fromExt) ? fromExt : null;
  }

  return null;
}

export function isAllowedUploadFile(mime: string, filename: string) {
  return normalizeUploadMime(mime, filename) !== null;
}
