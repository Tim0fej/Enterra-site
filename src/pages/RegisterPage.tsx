import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { PageShell } from '../components/Layout';
import { CopyIcon } from '../components/CopyIcon';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { register, user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await register(username, email, password);
      setAccessCode(user.accessCode);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!accessCode) return;
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
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
        <strong>Важно:</strong> в поле «Ник» введи <em>точно такой же</em> ник, как в Minecraft —
        те же буквы, цифры и регистр. Сайт и сервер связывают аккаунты по этому имени.
        Если ошибёшься — создай новый аккаунт или обратись к администрации.
      </div>

      <form className="form card" onSubmit={(e) => void handleSubmit(e)}>
        {error && <div className="alert alert--error">{error}</div>}

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
          <small>
            3–16 символов: латиница, цифры, _. Должен совпадать с ником в лаунчере Minecraft.
          </small>
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

        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            required
            minLength={6}
          />
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>

        <p className="form-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </PageShell>
  );
}
