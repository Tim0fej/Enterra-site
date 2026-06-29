import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { BotFormPayload } from '../hooks/useBotFormFields';

interface EmailCodeFieldProps {
  email?: string;
  purpose: 'register' | 'change_email' | 'verify_email' | 'login_verify' | 'reset_password';
  currentPassword?: string;
  challengeToken?: string;
  value: string;
  onChange: (code: string) => void;
  onSent?: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  botFields: BotFormPayload;
}

export function EmailCodeField({
  email,
  purpose,
  currentPassword,
  challengeToken,
  value,
  onChange,
  onSent,
  onError,
  disabled,
  botFields,
}: EmailCodeFieldProps) {
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sentHint, setSentHint] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    if (purpose !== 'login_verify' && !email?.trim()) {
      onError?.('Сначала укажите email');
      return;
    }
    if (purpose === 'change_email' && !currentPassword) {
      onError?.('Введите текущий пароль для отправки кода');
      return;
    }
    if (purpose === 'login_verify' && !challengeToken) {
      onError?.('Сессия входа истекла');
      return;
    }

    setSending(true);
    try {
      await api<{ ok: boolean; message: string }>('/auth/send-email-code', {
        method: 'POST',
        body: JSON.stringify({
          email: email?.trim() || undefined,
          purpose,
          currentPassword,
          challengeToken,
          ...botFields,
        }),
      });
      setSentHint(true);
      setCooldown(60);
      onSent?.();
    } catch (err) {
      onError?.(err instanceof ApiError ? err.message : 'Не удалось отправить код');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="email-code-field">
      <button
        type="button"
        className="btn btn--primary btn--full email-code-field__send"
        onClick={() => void sendCode()}
        disabled={disabled || sending || cooldown > 0}
      >
        {sending ? 'Отправка...' : cooldown > 0 ? `Повтор через ${cooldown}с` : 'Отправить код на почту'}
      </button>

      <label className="field">
        <span>Код из письма</span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="6 цифр"
          required
          minLength={6}
          maxLength={6}
          pattern="\d{6}"
          disabled={disabled}
        />
        <small>Код действует 15 минут</small>
      </label>

      {sentHint && cooldown > 0 && (
        <p className="email-code-field__hint">Письмо отправлено. Проверьте папку «Спам», если не видите его.</p>
      )}
    </div>
  );
}
