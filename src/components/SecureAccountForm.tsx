import { useState, type FormEvent, type ReactNode } from 'react';
import { useLayoutError } from './Layout';
import type { AuthResponse } from '../types/auth';
import { formatApiError } from '../utils/formatError';

interface SecureFormProps {
  title: string;
  description?: string;
  submitLabel: string;
  onSubmit: (currentPassword: string) => Promise<AuthResponse & { verificationReset?: boolean }>;
  onSuccess: (data: AuthResponse & { verificationReset?: boolean }) => void;
  children: ReactNode;
  disabled?: boolean;
}

export function SecureAccountForm({
  title,
  description,
  submitLabel,
  onSubmit,
  onSuccess,
  children,
  disabled,
}: SecureFormProps) {
  const { showError } = useLayoutError();
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await onSubmit(currentPassword);
      onSuccess(data);
      setCurrentPassword('');
    } catch (err) {
      showError(formatApiError(err, 'Ошибка сохранения'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="secure-form" onSubmit={(e) => void handleSubmit(e)}>
      <div className="secure-form__head">
        <h3>{title}</h3>
        {description && <p className="secure-form__desc">{description}</p>}
      </div>

      <div className="secure-form__fields">{children}</div>

      <label className="field secure-form__confirm">
        <span>Текущий пароль</span>
        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Подтвердите изменения"
            required
            autoComplete="current-password"
            disabled={disabled || loading}
          />
          <button
            type="button"
            className="password-field__toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? 'Скрыть' : 'Показать'}
          </button>
        </div>
        <small>Для безопасности любое изменение требует текущий пароль</small>
      </label>

      <button type="submit" className="btn btn--primary" disabled={disabled || loading || !currentPassword}>
        {loading ? 'Сохранение...' : submitLabel}
      </button>
    </form>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="field">
      <span>{label}</span>
      <div className="password-field">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          minLength={8}
          disabled={disabled}
        />
        <button
          type="button"
          className="password-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {visible ? 'Скрыть' : 'Показать'}
        </button>
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );
}
