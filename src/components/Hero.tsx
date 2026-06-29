import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { HERO_HIGHLIGHTS, SERVER_CONFIG } from '../config';
import { useAuth } from '../context/AuthContext';
import { copyText } from '../utils/copyText';
import { scrollToHash } from '../hooks/useScrollAnimation';
import type { ServerStatus } from '../types/server';
import { AccessCodeTimer } from './AccessCodeTimer';
import { CopyIcon } from './CopyIcon';
import { HeroNewsFeed } from './HeroNewsFeed';
import { Logo } from './Logo';

interface HeroProps {
  status: ServerStatus;
  onCopy: (success: boolean) => void;
}

export function Hero({ status, onCopy }: HeroProps) {
  const { user, refreshUser } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!user) return;
    const ok = await copyText(SERVER_CONFIG.ip);
    onCopy(ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCodeExpired = useCallback(() => {
    void refreshUser();
  }, [refreshUser]);

  const dotClass =
    status.state === 'loading'
      ? 'status-dot status-dot--loading'
      : status.state === 'online'
        ? 'status-dot status-dot--online'
        : status.state === 'maintenance'
          ? 'status-dot status-dot--maintenance'
          : 'status-dot status-dot--offline';

  const onlineValue =
    status.state === 'online' && status.playersOnline !== null
      ? String(status.playersOnline)
      : status.state === 'maintenance' && status.playersOnline !== null
        ? String(status.playersOnline)
        : '—';

  return (
    <section className="hero">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__grid-bg" aria-hidden="true" />

      <div className="container hero__inner">
        <h1 className="hero__welcome">Добро пожаловать</h1>
        <div className="hero__logo">
          <Logo size="lg" framed />
        </div>

        <p className="hero__tagline">
          Ванильный Minecraft · Java {SERVER_CONFIG.version} и выше · Моды для комфорта
        </p>

        <div className="hero-layout">
          <div className="hero-panel">
            <div className="hero-panel__top">
              <div className="hero-panel__status">
                <span className={dotClass} />
                <span>{status.label}</span>
              </div>
              {status.message ? (
                <p className="hero-panel__status-note muted">{status.message}</p>
              ) : null}
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
                    <span className="hero-panel__step-num" aria-hidden>
                      1
                    </span>
                    <span>Скопируй IP выше и добавь сервер в Minecraft</span>
                  </li>
                  <li>
                    <span className="hero-panel__step-num" aria-hidden>
                      2
                    </span>
                    <span>
                      Заходи с ником <strong>{user.username}</strong>
                      <span className="hero-panel__step-note">Такой же, как на сайте</span>
                    </span>
                  </li>
                  <li>
                    <span className="hero-panel__step-num" aria-hidden>
                      3
                    </span>
                    <span>
                      В чате на сервере: <code>/code</code> и код из профиля
                      <span className="hero-panel__step-note">45 сек на ввод · код обновляется раз в неделю</span>
                    </span>
                  </li>
                  <li>
                    <span className="hero-panel__step-num" aria-hidden>
                      4
                    </span>
                    <span>
                      Установи <Link to="/mods">моды Fabric</Link> для комфортной игры
                      <span className="hero-panel__step-note">Не обязательно, но так удобнее</span>
                    </span>
                  </li>
                </ol>

                <div className="hero-panel__actions">
                  <Link to="/profile" className="btn btn--primary btn--full">
                    {user.codeVerified ? 'Профиль' : 'Профиль — взять код'}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="hero-panel__locked">
                  <div className="hero-panel__lock-icon" aria-hidden>
                    🔒
                  </div>
                  <p>IP и код доступа откроются после регистрации</p>
                </div>

                <p className="hero-panel__hint">
                  При регистрации укажи <strong>тот же ник</strong>, что в Minecraft — иначе сервер
                  не узнает тебя.
                </p>

                <div className="hero-panel__actions">
                  <Link to="/register" className="btn btn--primary btn--full">
                    Регистрация
                  </Link>
                </div>

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

          <aside className="hero-side">
            <div className="hero-side__stats">
              <div className="hero-stat">
                <span className="hero-stat__value">{onlineValue}</span>
                <span className="hero-stat__label">онлайн сейчас</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat__value">
                  {status.playersMax !== null ? String(status.playersMax) : SERVER_CONFIG.maxPlayers}
                </span>
                <span className="hero-stat__label">слотов</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat__value">{SERVER_CONFIG.versionLabel}</span>
                <span className="hero-stat__label">Java и выше</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat__value">24/7</span>
                <span className="hero-stat__label">работа</span>
              </div>
            </div>

            <ul className="hero-highlights">
              {HERO_HIGHLIGHTS.filter((item) => user || !('authOnly' in item && item.authOnly)).map((item) => {
                const body = (
                  <>
                    <span className="hero-highlight__icon" aria-hidden>
                      {item.icon}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </>
                );

                return (
                  <li key={item.title}>
                    {'href' in item && item.href ? (
                      'external' in item && item.external ? (
                        <a
                          href={item.href}
                          className="hero-highlight hero-highlight--link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {body}
                        </a>
                      ) : (
                        <Link to={item.href} className="hero-highlight hero-highlight--link">
                          {body}
                        </Link>
                      )
                    ) : (
                      <div className="hero-highlight">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            {user?.codeExpiresAt && (
              <AccessCodeTimer
                expiresAt={user.codeExpiresAt}
                onExpired={handleCodeExpired}
                compact
              />
            )}
          </aside>

          <HeroNewsFeed />
        </div>
      </div>

      <div className="hero__blocks hero__blocks--left" aria-hidden="true">
        <div className="block block--navy" />
        <div className="block block--blue" />
        <div className="block block--ice" />
      </div>
    </section>
  );
}
