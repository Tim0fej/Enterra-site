import { db } from '../db.js';
import { ACTIVE_PRIVILEGE_SQL } from './grantPrivilege.js';
import { normalizeMediaPlatform, resolveDisplayGroup } from '../../shared/displayGroup.js';
import { fetchMcOnline, type McOnlineData } from './mcstatus.js';
import { sqlExcludeSystemAccount } from '../../shared/systemAccount.js';
import type { UserRole } from '../auth.js';

type UserRow = {
  id: number;
  username: string;
  role: UserRole;
  privilege_slug: string | null;
  media_platform: string | null;
};

function isUserOnline(user: UserRow, sessionUserIds: Set<number>, onlineNames: Set<string>): boolean {
  return sessionUserIds.has(user.id) || onlineNames.has(user.username.toLowerCase());
}

export async function fetchOnlinePlayerData(): Promise<{
  mc: McOnlineData;
  registeredOnline: Array<{
    id: number;
    username: string;
    role: UserRole;
    displayGroup: ReturnType<typeof resolveDisplayGroup>;
    privilege_slug: string | null;
    media_platform: ReturnType<typeof normalizeMediaPlatform>;
  }>;
  guestOnline: string[];
  onlineUserIds: number[];
}> {
  const mc = await fetchMcOnline();
  const onlineNames = new Set(mc.playerNames);

  const sessionUserIds = new Set(
    (db.prepare('SELECT user_id FROM mc_online_sessions').all() as Array<{ user_id: number }>).map(
      (row) => row.user_id,
    ),
  );

  const rows = db
    .prepare(`
      SELECT
        u.id,
        u.username,
        u.role,
        pt.slug as privilege_slug,
        up.media_platform
      FROM users u
      LEFT JOIN user_privileges up ON up.user_id = u.id AND ${ACTIVE_PRIVILEGE_SQL}
      LEFT JOIN privilege_tiers pt ON pt.id = up.tier_id
      WHERE ${sqlExcludeSystemAccount('u')}
    `)
    .all() as UserRow[];

  const registeredNames = new Set(rows.map((user) => user.username.toLowerCase()));
  const registeredOnline = rows
    .filter((user) => isUserOnline(user, sessionUserIds, onlineNames))
    .map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      privilege_slug: user.privilege_slug,
      media_platform: normalizeMediaPlatform(user.media_platform),
      displayGroup: resolveDisplayGroup(user.role, user.privilege_slug, user.media_platform),
    }))
    .sort((a, b) => a.username.localeCompare(b.username, 'ru'));

  const guestOnline = mc.playerNamesDisplay.filter(
    (name) => !registeredNames.has(name.toLowerCase()),
  );

  return {
    mc,
    registeredOnline,
    guestOnline,
    onlineUserIds: registeredOnline.map((user) => user.id),
  };
}
