import type { DisplayGroupId, MediaPlatform } from '../../shared/displayGroup';

export interface PlayerListItem {
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

export interface VipPlan {
  months: 1 | 3 | 6;
  priceRub: number;
  label: string;
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
  vipPlans: VipPlan[];
  boostyUrl: string;
  donationAlertsUrl: string;
  easydonateEnabled: boolean;
  easydonateShopUrl: string;
  vipPurchaseEnabled: boolean;
}

export interface EasyDonateCheckoutResult {
  ok: boolean;
  paymentId: number;
  paymentUrl: string;
  message: string;
}

export interface ShopProduct {
  id: number;
  name: string;
  priceRub: number;
  description: string | null;
  vipMonths: 1 | 3 | 6 | null;
  category: import('../../shared/shopCatalog').ShopCategoryId;
  badgeSlug: import('../../shared/displayGroup').DisplayGroupId | null;
}

export interface ShopInfo {
  title: string;
  description: string;
  serverCost: {
    monthlyRub: number;
    note: string;
  };
  easydonateEnabled: boolean;
  easydonateShopUrl: string;
  products: ShopProduct[];
}

export interface ShopRecentPurchase {
  id: number;
  kind: 'purchase' | 'donation';
  username: string;
  label: string;
  amountRub: number | null;
  createdAt: string;
}

export interface PurchaseCheckoutResult {
  ok: boolean;
  orderId: number;
  confirmationUrl: string;
  message: string;
}

export interface PaymentStatusResult {
  orderId: number;
  status: string;
  tierSlug: string;
  months: number;
  amountRub: number;
  completed: boolean;
}

export interface PurchaseResult {
  ok: boolean;
  privilege: { slug: string; name: string; color: string; mediaPlatform?: null };
  message: string;
}
