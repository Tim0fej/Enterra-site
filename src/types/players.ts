import type { DisplayGroupId, MediaPlatform } from '../../shared/displayGroup';

export interface PlayerListItem {
  id: number;
  username: string;
  registeredAt: string;
  verified: boolean;
  online: boolean;
  isStaff: boolean;
  staffRole: 'admin' | 'moderator' | null;
  role: string;
  privilegeSlug: string | null;
  mediaPlatform: MediaPlatform | null;
  displayGroup: DisplayGroupId;
}

export interface PlayersResponse {
  server: {
    online: boolean;
    playersOnline: number;
    playersMax: number | null;
  };
  total: number;
  verifiedCount: number;
  onlineCount: number;
  players: PlayerListItem[];
}

export interface PrivilegeTier {
  id: number;
  slug: string;
  name: string;
  description: string;
  color: string;
}

export interface SupportPrivilege {
  slug: string;
  name: string;
  description: string;
  color: string;
  price_rub: number | null;
  billing_period: string | null;
  purchasable: boolean;
  benefits: string[];
}

export interface SupportInfo {
  title: string;
  description: string;
  serverCost: {
    monthlyRub: number;
    label: string;
    note: string;
  };
  privileges: SupportPrivilege[];
  boostyUrl: string;
}

export interface PurchaseResult {
  ok: boolean;
  privilege: { slug: string; name: string; color: string; mediaPlatform?: null };
  message: string;
}
