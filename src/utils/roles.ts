export type UserRole = 'user' | 'moderator' | 'admin';

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Игрок',
  moderator: 'Модератор',
  admin: 'Администратор',
};

export function isStaff(role: UserRole): boolean {
  return role === 'admin' || role === 'moderator';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function roleBadgeClass(role: UserRole): string {
  if (role === 'admin') return 'badge badge--admin';
  if (role === 'moderator') return 'badge badge--moder';
  return 'badge';
}
