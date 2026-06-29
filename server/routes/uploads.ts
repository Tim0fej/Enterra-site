import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { authMiddleware, optionalAuth, type AuthRequest } from '../auth.js';
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  maxBytesForMime,
  isAllowedUploadMime,
  isAllowedUploadFile,
} from '../../shared/attachments.js';
import {
  UPLOADS_DIR,
  assertPendingUploadQuota,
  canAccessAttachment,
  getAttachmentById,
  getAttachmentFilePath,
  insertAttachment,
} from '../lib/attachments.js';
import { sniffMimeType } from '../lib/fileSniff.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 16);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { files: MAX_ATTACHMENTS_PER_MESSAGE, fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedUploadFile(file.mimetype, file.originalname)) {
      cb(new Error('Разрешены только фото (JPG, PNG, GIF, WebP) и видео (MP4, WebM, MOV)'));
      return;
    }
    cb(null, true);
  },
});

router.use((req, res, next) => {
  req.setTimeout(120_000);
  res.setTimeout(120_000);
  next();
});

router.post('/', authMiddleware, (req: AuthRequest, res, next) => {
  upload.array('files', MAX_ATTACHMENTS_PER_MESSAGE)(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      res.status(400).json({ error: message });
      return;
    }
    next();
  });
}, (req: AuthRequest, res) => {
  const files = (req as AuthRequest & { files?: Express.Multer.File[] }).files ?? [];
  if (files.length === 0) {
    res.status(400).json({ error: 'Выберите файлы' });
    return;
  }

  try {
    assertPendingUploadQuota(req.user!.id);
  } catch (err) {
    res.status(429).json({ error: err instanceof Error ? err.message : 'Слишком много загрузок' });
    return;
  }

  const uploaded = [];
  for (const file of files) {
    const detectedMime = sniffMimeType(file.path);
    if (!detectedMime || !isAllowedUploadMime(detectedMime)) {
      fs.unlink(file.path, () => undefined);
      res.status(400).json({ error: 'Файл не прошёл проверку содержимого' });
      return;
    }

    if (file.size > maxBytesForMime(detectedMime)) {
      fs.unlink(file.path, () => undefined);
      res.status(400).json({
        error: detectedMime.startsWith('video/')
          ? 'Видео не больше 50 МБ'
          : 'Фото не больше 10 МБ',
      });
      return;
    }

    uploaded.push(
      insertAttachment(
        req.user!.id,
        file.filename,
        file.originalname,
        detectedMime,
        file.size,
      ),
    );
  }

  res.status(201).json({ attachments: uploaded });
});

router.get('/:id', optionalAuth, (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'Некорректный ID' });
    return;
  }

  const attachment = getAttachmentById(id);
  if (!attachment) {
    res.status(404).json({ error: 'Файл не найден' });
    return;
  }

  if (!canAccessAttachment(attachment, req.user)) {
    res.status(404).json({ error: 'Файл не найден' });
    return;
  }

  const filePath = getAttachmentFilePath(attachment.stored_name);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Файл не найден' });
    return;
  }

  res.setHeader('Content-Type', attachment.mime_type);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(attachment.original_name)}`,
  );
  res.sendFile(filePath);
});

export default router;
