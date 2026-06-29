const USERNAME_RE = /^[a-zA-Z0-9_]{3,16}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(username: string): string | null {
  const value = username.trim();
  if (!value) return 'Введите ник';
  if (!USERNAME_RE.test(value)) return 'Ник: 3–16 символов, только буквы, цифры и _';
  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  if (!value) return 'Введите email';
  if (!EMAIL_RE.test(value)) return 'Некорректный email';
  return null;
}

export function validatePassword(password: string, min = 8): string | null {
  if (!password) return 'Введите пароль';
  if (password.length < min) return `Пароль минимум ${min} символов`;
  if (password.length > 128) return 'Пароль слишком длинный';
  if (!/[a-zA-Zа-яА-Я]/.test(password) || !/\d/.test(password)) {
    return 'Пароль должен содержать буквы и цифры';
  }
  return null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim();
}
