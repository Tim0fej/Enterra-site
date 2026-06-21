import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SERVER_CONFIG } from '../config';
import { useAuth } from '../context/AuthContext';
import { scrollToHash } from '../hooks/useScrollAnimation';
import type { ServerStatus } from '../types/server';
import { CopyIcon } from './CopyIcon';
import { Logo } from './Logo';

interface HeroProps {
  status: ServerStatus;
  onCopy: (success: boolean) => void;
}

export function Hero({ status, onCopy }: HeroProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(SERVER_CONFIG.ip);
      onCopy(true);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onCopy(false);
    }
  };

  const dotClass =
    status.state === 'loading'
      ? 'status-dot status-dot--loading'
      : status.state === 'online'
        ? 'status-dot status-dot--online'
        : 'status-dot status-dot--offline';

  return (
    <section className="hero">
      <div className="container hero__inner">
        <Logo size="lg" framed className="hero__logo" />

        <p className="hero__tagline">Ванильный Minecraft · Java {SERVER_CONFIG.version}</p>

        <div className="hero-panel">
          <div className="hero-panel__top">
            <div className="hero-panel__status">
              <span className={dotClass} />
              <span>{status.label}</span>
            </div>
          </div>

          {user ? (
            <>
              <button
                type="button"
                className={`hero-panel__ip${copied ? ' copied' : ''}`}
                onClick={() => void handleCopy()}
                title="Скопировать IP"
              >
                <span className="hero-panel__ip-label">IP сервера</span>
                <code>{SERVER_CONFIG.ip}</code>
                <span className="hero-panel__ip-action">
                  <CopyIcon size={16} />
                  {copied ? 'Скопировано' : 'Нажми, чтобы скопировать'}
                </span>
              </button>

              <ol className="hero-panel__steps">
                <li>
                  <span className="hero-panel__step-num" aria-hidden>1</span>
                  <span>Скопируй IP выше и добавь сервер в Minecraft</span>
                </li>
                <li>
                  <span className="hero-panel__step-num" aria-hidden>2</span>
                  <span>
                    Заходи с ником <strong>{user.username}</strong>
                    <span className="hero-panel__step-note">Такой же, как на сайте</span>
                  </span>
                </li>
                <li>
                  <span className="hero-panel__step-num" aria-hidden>3</span>
                  <span>
                    В чате на сервере: <code>/code</code> и код из профиля
                  </span>
                </li>
              </ol>

              <Link to="/profile" className="btn btn--primary btn--full">
                {user.codeVerified ? 'Профиль' : 'Профиль — взять код'}
              </Link>
            </>
          ) : (
            <>
              <div className="hero-panel__locked">
                <div className="hero-panel__lock-icon" aria-hidden>🔒</div>
                <p>IP и код доступа откроются после регистрации</p>
              </div>

              <p className="hero-panel__hint">
                При регистрации укажи <strong>тот же ник</strong>, что в Minecraft — иначе сервер
                не узнает тебя.
              </p>

              <Link to="/register" className="btn btn--primary btn--full">
                Регистрация
              </Link>

              <p className="hero-panel__login">
                Уже есть аккаунт? <Link to="/login">Войти</Link>
                {' · '}
                <a
                  href="#join"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToHash('#join');
                  }}
                >
                  Подробная инструкция
                </a>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="hero__blocks" aria-hidden="true">
        <div className="block block--cyan" />
        <div className="block block--blue" />
        <div className="block block--navy" />
        <div className="block block--ice" />
      </div>
    </section>
  );
}
