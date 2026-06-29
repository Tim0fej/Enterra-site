import fs from 'fs';

const SIGNATURES: Array<{ mime: string; match: (buf: Buffer) => boolean }> = [
  {
    mime: 'image/jpeg',
    match: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    mime: 'image/png',
    match: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47,
  },
  {
    mime: 'image/gif',
    match: (buf) =>
      buf.length >= 6 &&
      buf.subarray(0, 3).toString('ascii') === 'GIF' &&
      (buf[3] === 0x38 || buf[3] === 0x39),
  },
  {
    mime: 'image/webp',
    match: (buf) =>
      buf.length >= 12 &&
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  {
    mime: 'video/webm',
    match: (buf) => buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3,
  },
  {
    mime: 'video/mp4',
    match: (buf) => buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp',
  },
  {
    mime: 'video/quicktime',
    match: (buf) => {
      if (buf.length < 12) return false;
      const brand = buf.subarray(4, 8).toString('ascii');
      return brand === 'ftyp' || brand === 'moov' || brand === 'mdat' || brand === 'wide';
    },
  },
];

function sniffFromBuffer(buf: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (sig.match(buf)) return sig.mime;
  }

  const ftypIdx = buf.indexOf('ftyp');
  if (ftypIdx >= 4 && ftypIdx <= 64) {
    const brand = buf.subarray(ftypIdx + 4, ftypIdx + 8).toString('ascii');
    if (brand.startsWith('qt') || brand.includes('mov')) {
      return 'video/quicktime';
    }
    return 'video/mp4';
  }

  return null;
}

export function sniffMimeType(filePath: string): string | null {
  try {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buf = Buffer.alloc(512);
      const bytesRead = fs.readSync(fd, buf, 0, buf.length, 0);
      if (bytesRead <= 0) return null;
      return sniffFromBuffer(buf.subarray(0, bytesRead));
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return null;
  }
}
