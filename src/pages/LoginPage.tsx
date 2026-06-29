import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmailCodeField } from '../components/EmailCodeField';
import { PasswordField } from '../components/SecureAccountForm';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { PageShell, useLayoutError } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useBotFormFields } from '../hooks/useBotFormFields';
import { safeNextPath } from '../utils/safePath';
import { formatApiError } from '../utils/formatError';
import { isLoginVerificationResponse, type LoginVerificationResponse } from '../types/auth';
import { HONEYPOT_FIELD } from '../../shared/botProtection';

export function LoginPage() {
  const { login, verifyLogin } = useAuth();
  const { showError } = useLayoutError();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    website,
    setWebsite,
    turnstileConfig,
    turnstileKey,
    setTurnstileToken,
    resetTurnstile,
    botFields,
  } = useBotFormFields();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [verification, setVerification] = useState<LoginVerificationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const goNext = () => {
    navigate(safeNextPath(searchParams.get('next')));
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turnstileConfig.enabled && !botFields.turnstileToken) {
      showError('Подтвердите, что вы не робот');
      return;
    }

    setLoading(true);

    try {
      const result = await login(loginValue, password, botFields);
      if (isLoginVerificationResponse(result)) {
        setVerification(result);
        setEmailCode('');
        return;
      }
      goNext();
    } catch (err) {
      resetTurnstile();
      showError(formatApiError(err, 'Ошибка входа'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verification) return;

    setLoading(true);

    try {
      await verifyLogin(verification.challengeToken, emailCode, loginValue, botFields);
      goNext();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка подтверждения'));
    } finally {
      setLoading(false);
    }
  };

  if (verification) {
    return (
      <PageShell
        title="Подтверждение входа"
        subtitle="Новое устройство или IP — нужен код с почты"
        backTo={{
          to: '/login',
          label: 'Назад',
          onClick: () => {
            setVerification(null);
            setEmailCode('');
          },
        }}
      >
        <div className="alert alert--info">
          {verification.message} Письмо отправлено на <strong>{verification.maskedEmail}</strong>.
        </div>

        <form className="form card" onSubmit={(e) => void handleVerify(e)}>
          <EmailCodeField
            purpose="login_verify"
            challengeToken={verification.challengeToken}
            value={emailCode}
            onChange={setEmailCode}
            onError={showError}
            disabled={loading}
            botFields={botFields}
          />

          <button type="submit" className="btn btn--primary btn--full" disabled={loading || emailCode.length < 6}>
            {loading ? 'Проверка...' : 'Подтвердить и войти'}
          </button>

          <button
            type="button"
            className="btn btn--ghost btn--full"
            disabled={loading}
            onClick={() => {
              setVerification(null);
              setEmailCode('');
            }}
          >
            Ввести другой логин
          </button>
        </form>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Вход"
      subtitle="Войди в аккаунт Enterra"
      backTo={{ to: '/', label: 'Главная' }}
    >
      <form className="form card" onSubmit={(e) => void handleCredentials(e)}>
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
          <span>Ник или Email</span>
          <input
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            placeholder="Steve или you@email.com"
            autoComplete="username"
            required
          />
        </label>

        <PasswordField
          label="Пароль"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <p className="form-forgot-link">
          <Link to="/forgot-password">Забыли пароль?</Link>
        </p>

        {turnstileConfig.enabled && turnstileConfig.siteKey && (
          <TurnstileWidget
            siteKey={turnstileConfig.siteKey}
            widgetKey={turnstileKey}
            onToken={setTurnstileToken}
            onExpire={resetTurnstile}
          />
        )}

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'Проверка...' : 'Продолжить'}
        </button>

        <p className="form-footer muted">
          С нового устройства после пароля придёт код на email. С того же IP — вход сразу.
        </p>

        <p className="form-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </PageShell>
  );
}
