import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.join(__dirname, '..');

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT_DIR, 'data');

export const DB_PATH = path.join(DATA_DIR, 'enterra.db');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const DIST_DIR = path.join(ROOT_DIR, 'dist');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
