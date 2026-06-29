import { Router } from 'express';
import { loadEnv } from '../env.js';
import {
  LEGAL_PAYMENT_TERMS,
  LEGAL_REFUND_TERMS,
  LEGAL_SERVICE_DESCRIPTION,
  LEGAL_UPDATED,
} from '../../shared/legalContent.js';
import { DEFAULT_LEGAL_REQUISITES } from '../../shared/legalRequisites.js';
import { SUPPORT_EMAIL } from '../../shared/supportConfig.js';

const router = Router();
const env = loadEnv();

function legalField(envKey: string, fallback: string): string {
  const value = process.env[envKey]?.trim();
  return value || fallback;
}

router.get('/', (_req, res) => {
  res.json({
    updated: LEGAL_UPDATED,
    sellerName: legalField('LEGAL_SELLER_NAME', DEFAULT_LEGAL_REQUISITES.sellerName),
    sellerStatus: legalField('LEGAL_SELLER_STATUS', DEFAULT_LEGAL_REQUISITES.sellerStatus),
    inn: legalField('LEGAL_INN', DEFAULT_LEGAL_REQUISITES.inn),
    ogrnip: process.env.LEGAL_OGRNIP?.trim() ?? '',
    ogrn: process.env.LEGAL_OGRN?.trim() ?? '',
    email: legalField('LEGAL_EMAIL', SUPPORT_EMAIL),
    phone: process.env.LEGAL_PHONE?.trim() ?? '',
    address: process.env.LEGAL_ADDRESS?.trim() ?? '',
    siteUrl: env.siteUrl,
    serviceDescription: LEGAL_SERVICE_DESCRIPTION,
    paymentTerms: LEGAL_PAYMENT_TERMS,
    refundTerms: LEGAL_REFUND_TERMS,
  });
});

export default router;
