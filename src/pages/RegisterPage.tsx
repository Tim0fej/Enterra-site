import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { EmailCodeField } from '../components/EmailCodeField';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { PageShell, useLayoutError } from '../components/Layout';
import { CopyIcon } from '../components/CopyIcon';
import { useAuth } from '../context/AuthContext';
import { useBotFormFields } from '../hooks/useBotFormFields';
import { copyText } from '../utils/copyText';
import { validateEmail, validatePassword } from '../../shared/accountValidation';
import { formatApiError } from '../utils/formatError';
import { HONEYPOT_FIELD } from '../../shared/botProtection';

export function RegisterPage() {
  const { register, user } = useAuth();
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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      showError(emailError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      showError(passwordError);
      return;
    }

    if (!acceptTerms) {
      showError('Примите пользовательское соглашение и правила сервера');
      return;
    }

    if (turnstileConfig.enabled && !botFields.turnstileToken) {
      showError('Подтвердите, что вы не робот');
      return;
    }

    setLoading(true);

    try {
      const user = await register(username, email, password, emailCode, acceptTerms, botFields);
      setAccessCode(user.accessCode);
    } catch (err) {
      resetTurnstile();
      showError(formatApiError(err, 'Ошибка регистрации'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!accessCode) return;
    const ok = await copyText(accessCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (user && !accessCode) {
    return <Navigate to="/profile" replace />;
  }

  if (accessCode) {
    return (
      <PageShell title="Готово!" subtitle={`Аккаунт «${username}» создан — этот же ник нужен в Minecraft`}>
        <div className="alert alert--info">
          Заходи на сервер только с ником <strong>{username}</strong>. Если ник в игре другой — вход не сработает.
        </div>

        <div className="card card--highlight">
          <p className="card__label">Код доступа</p>
          <div className="code-display">
            <code className="code-display__value">{accessCode}</code>
            <button type="button" className={`btn btn--small${copied ? ' copied' : ''}`} onClick={() => void handleCopy()}>
              <CopyIcon size={16} />
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
          <p className="card__hint">
            На сервере в чат: <code>/code {accessCode}</code>
          </p>
        </div>

        <div className="info-steps">
          <h3>Что дальше?</h3>
          <ol>
            <li>IP сервера и код — в профиле на сайте</li>
            <li>Запусти Minecraft с ником <strong>{username}</strong></li>
            <li>Подключись к серверу и введи код командой /code</li>
          </ol>
        </div>

        <div className="form-actions">
          <Link to="/profile" className="btn btn--primary">В профиль — IP и код</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Регистрация"
      subtitle="Ник на сайте = ник в Minecraft. Другой ник — сервер не пустит"
      backTo={{ to: '/', label: 'Главная' }}
    >
      <div className="alert alert--info">
        <strong>Важно:</strong> в поле «Ник» введи <em>точно такой же</em> ник, как в Minecraft.
        Email нужно подтвердить кодом из письма.
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
          <span>Ник в Minecraft</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Например: Steve"
            required
            minLength={3}
            maxLength={16}
            pattern="[a-zA-Z0-9_]{3,16}"
            autoComplete="username"
          />
          <small>3–16 символов: латиница, цифры, _</small>
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
          />
        </label>

        <EmailCodeField
          email={email}
          purpose="register"
          value={emailCode}
          onChange={setEmailCode}
          onError={showError}
          botFields={botFields}
        />

        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 8 символов, буквы и цифры"
            required
            minLength={8}
          />
        </label>

        <label className="form-checkbox">
          <input
            type="checkbox"
            className="form-checkbox__input"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            required
          />
          <span className="form-checkbox__text">
            Я принимаю{' '}
            <Link to="/terms" target="_blank" rel="noopener noreferrer">
              пользовательское соглашение
            </Link>
            ,{' '}
            <Link to="/rules" target="_blank" rel="noopener noreferrer">
              правила сервера
            </Link>{' '}
            и ознакомился с{' '}
            <Link to="/faq" target="_blank" rel="noopener noreferrer">
              FAQ
            </Link>
          </span>
        </label>

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
          disabled={loading || emailCode.length !== 6 || !acceptTerms}
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>

        <p className="muted form-note">
          Один аккаунт на человека. С одного IP нельзя зарегистрировать второй аккаунт.
        </p>

        <p className="form-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </PageShell>
  );
}
