import type { ModerationActionType, PunishmentType } from '../../shared/moderation';

export interface RecentPurchase {
  id: number;
  paymentId: number;
  username: string;
  amountRub: number;
  label: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt: string | null;
}

export interface PunishmentEntry {
  id: number;
  type: PunishmentType;
  targetUsername: string;
  reason: string | null;
  staffName: string | null;
  expiresAt: string | null;
  syncedAt: string;
}

export interface ModerationHistoryEntry {
  id: number;
  action: ModerationActionType;
  actionLabel: string;
  targetUsername: string;
  duration: string | null;
  reason: string;
  staffUsername: string;
  status: 'pending' | 'done' | 'failed';
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface ModerationPanelData {
  purchases: RecentPurchase[];
  punishments: PunishmentEntry[];
  history: ModerationHistoryEntry[];
}
