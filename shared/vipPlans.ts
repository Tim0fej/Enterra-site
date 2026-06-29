export const VIP_SLUG = 'vip';

export const VIP_MONTHLY_PRICE_RUB = 99;

export const VIP_PLAN_MONTHS = [1, 3, 6] as const;

export type VipPlanMonths = (typeof VIP_PLAN_MONTHS)[number];

export interface VipPlan {
  months: VipPlanMonths;
  priceRub: number;
  label: string;
}

export function getVipPlanPrice(months: VipPlanMonths): number {
  return VIP_MONTHLY_PRICE_RUB * months;
}

export function isVipPlanMonths(value: unknown): value is VipPlanMonths {
  return typeof value === 'number' && (VIP_PLAN_MONTHS as readonly number[]).includes(value);
}

export function formatVipPlanLabel(months: VipPlanMonths): string {
  if (months === 1) return '1 месяц';
  if (months === 3) return '3 месяца';
  return '6 месяцев';
}

export function buildVipPlans(): VipPlan[] {
  return VIP_PLAN_MONTHS.map((months) => ({
    months,
    priceRub: getVipPlanPrice(months),
    label: formatVipPlanLabel(months),
  }));
}
