import type { NextFunction, Request, Response } from 'express';
import { loadEnv } from '../env.js';
import { secureCompareSecret } from './secureCompare.js';

export function requireMinecraftApiKey(req: Request, res: Response, next: NextFunction) {
  const { minecraftApiKey } = loadEnv();
  const apiKey = req.headers['x-api-key'];
  if (!secureCompareSecret(apiKey, minecraftApiKey)) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }
  next();
}
