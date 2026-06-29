import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmailCodeField } from '../components/EmailCodeField';
import { PasswordField } from '../components/SecureAccountForm';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { PageShell, useLayoutError } from '../components/Layout';
import { api } from '../api/client';
import { useBotFormFields } from '../hooks/useBotFormFields';
import { validateEmail, validatePassword } from '../../shared/accountValidation';
import { formatApiError } from '../utils/formatError';
import { HONEYPOT_FIELD } from '../../shared/botProtection';

export function ForgotPasswordPage() {
  const { showError } = useLayoutError();
  const {
    website,
    setWebsite,
    turnstileConfig,
    turnstileKey,
    setTurnstileToken,
    resetTurnstile,
    botFields,
  } = useBotFormFields();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      showError(emailError);
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Пароли не совпадают');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showError(passwordError);
      return;
    }

    if (emailCode.length !== 6) {
      showError('Введите 6-значный код из письма');
      return;
    }

    if (turnstileConfig.enabled && !botFields.turnstileToken) {
      showError('Подтвердите, что вы не робот');
      return;
    }

    setLoading(true);

    try {
      await api<{ ok: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          emailCode,
          newPassword,
          ...botFields,
        }),
      });
      setDone(true);
    } catch (err) {
      resetTurnstile();
      showError(formatApiError(err, 'Не удалось обновить пароль'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <PageShell
        title="Пароль обновлён"
        subtitle="Теперь можно войти с новым паролем"
        backTo={{ to: '/login', label: 'К входу' }}
      >
        <div className="alert alert--info">
          Пароль успешно изменён. Все другие устройства будут разлогинены.
        </div>

        <div className="form-actions">
          <Link to="/login" className="btn btn--primary btn--full">
            Войти в аккаунт
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Сброс пароля"
      subtitle="Код придёт на email, указанный при регистрации"
      backTo={{ to: '/login', label: 'К входу' }}
    >
      <div className="alert alert--info">
        Укажите email аккаунта, получите код и задайте новый пароль.
      </div>

      <form className="form card" onSubmit={(e) => void handleSubmit(e)}>
        <label className="auth-hp" aria-hidden="true">
          <span>Сайт</span>
          <input
            type="text"
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Email аккаунта</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            required
          />
        </label>

        <EmailCodeField
          email={email}
          purpose="reset_password"
          value={emailCode}
          onChange={setEmailCode}
          onSent={() => {}}
          onError={showError}
          disabled={loading}
          botFields={botFields}
        />

        <PasswordField
          label="Новый пароль"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
        />

        <PasswordField
          label="Повторите пароль"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />

        {turnstileConfig.enabled && turnstileConfig.siteKey && (
          <TurnstileWidget
            siteKey={turnstileConfig.siteKey}
            widgetKey={turnstileKey}
            onToken={setTurnstileToken}
            onExpire={resetTurnstile}
          />
        )}

        <button
          type="submit"
          className="btn btn--primary btn--full"
          disabled={loading || emailCode.length !== 6 || !newPassword || !confirmPassword}
        >
          {loading ? 'Сохранение...' : 'Обновить пароль'}
        </button>

        <p className="form-footer">
          Вспомнили пароль? <Link to="/login">Войти</Link>
        </p>
      </form>
    </PageShell>
  );
}
