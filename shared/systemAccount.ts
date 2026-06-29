export const SYSTEM_ACCOUNT_EMAIL = 'admin@enterra.local';
export const SYSTEM_ACCOUNT_USERNAME = 'Admin';

export function isSystemAccount(profile: {
  email?: string | null;
  username?: string | null;
}): boolean {
  const email = profile.email?.trim().toLowerCase() ?? '';
  const username = profile.username?.trim().toLowerCase() ?? '';
  return (
    email === SYSTEM_ACCOUNT_EMAIL ||
    username === SYSTEM_ACCOUNT_USERNAME.toLowerCase()
  );
}

/** SQL fragment: true when alias row is NOT the hidden system account. */
export function sqlExcludeSystemAccount(alias: string): string {
  return `(
    LOWER(COALESCE(${alias}.email, '')) != '${SYSTEM_ACCOUNT_EMAIL}'
    AND LOWER(COALESCE(${alias}.username, '')) != '${SYSTEM_ACCOUNT_USERNAME.toLowerCase()}'
  )`;
}

export const SYSTEM_ACCOUNT_ID_SUBQUERY = `(
  SELECT id FROM users
  WHERE LOWER(email) = '${SYSTEM_ACCOUNT_EMAIL}'
     OR LOWER(username) = '${SYSTEM_ACCOUNT_USERNAME.toLowerCase()}'
)`;
