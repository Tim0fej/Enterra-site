import { useCallback, useState } from 'react';
import { api, ApiError } from '../api/client';
import { PageShell } from '../components/Layout';
import { CopyIcon } from '../components/CopyIcon';
import { AccessCodeTimer } from '../components/AccessCodeTimer';
import { PasswordField, SecureAccountForm } from '../components/SecureAccountForm';
import { validatePassword } from '../../shared/accountValidation';
import { EmailCodeField } from '../components/EmailCodeField';
import { useAuth } from '../context/AuthContext';
import { useBotFormFields } from '../hooks/useBotFormFields';
import { useLayoutToast } from '../components/Layout';
import { formatApiError } from '../utils/formatError';
import { SERVER_CONFIG } from '../config';
import { GroupBadge } from '../components/GroupBadge';
import { ProfileNameColor, ProfileNameColorUpsell } from '../components/ProfileNameColor';
import { formatSiteDate } from '../utils/formatDate';
import { WebSessionsPanel } from '../components/WebSessionsPanel';
import { copyText } from '../utils/copyText';
import type { AuthResponse } from '../types/auth';

type ProfileSection = 'server' | 'account' | 'security';

export function ProfilePage() {
  const { user, setUserData, logout, refreshUser } = useAuth();
  const { botFields } = useBotFormFields();
  const { showToast, showError } = useLayoutToast();
  const [section, setSection] = useState<ProfileSection>('server');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [emailVerifyOpen, setEmailVerifyOpen] = useState(false);
  const [verifyEmailCode, setVerifyEmailCode] = useState('');
  const [verifyEmailSaving, setVerifyEmailSaving] = useState(false);

  const handleCodeExpired = useCallback(() => {
    void refreshUser().then(() => {
      showToast('Код обновлён — возьми новый в профиле и введи /code на сервере');
    });
  }, [refreshUser, showToast]);

  if (!user) return null;

  const applyUpdate = (data: AuthResponse & { verificationReset?: boolean }) => {
    setUserData(data.user);
    if (data.verificationReset) {
      showToast('Ник изменён — снова введите /code на сервере');
    }
  };

  const copy = async (text: string, type: 'code' | 'ip') => {
    const ok = await copyText(text);
    if (ok) {
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedIp(true);
        setTimeout(() => setCopiedIp(false), 2000);
      }
      showToast(type === 'code' ? 'Код скопирован!' : 'IP скопирован!');
    } else {
      showToast('Не удалось скопировать');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Сгенерировать новый код? Старый перестанет работать.')) return;
    setRegenerating(true);
    try {
      const data = await api<{ accessCode: string; codeExpiresAt?: string }>('/auth/regenerate-code', {
        method: 'POST',
      });
      setUserData({
        ...user,
        accessCode: data.accessCode,
        codeExpiresAt: data.codeExpiresAt ?? user.codeExpiresAt,
        codeVerified: false,
      });
      showToast('Новый код сгенерирован');
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    } finally {
      setRegenerating(false);
    }
  };

  const sections: { id: ProfileSection; label: string }[] = [
    { id: 'server', label: 'Сервер' },
    { id: 'account', label: 'Аккаунт' },
    { id: 'security', label: 'Безопасность' },
  ];

  return (
    <PageShell title="Профиль" subtitle={user.username} wide>
      <nav className="profile-tabs" aria-label="Разделы профиля">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`profile-tabs__btn${section === item.id ? ' active' : ''}`}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="profile-layout">
        {section === 'server' && (
          <div className="profile-layout__panel">
            <div className="play-card card">
              <h3 className="play-card__title">Подключение к серверу</h3>

              <div className="play-card__grid">
                <button
                  type="button"
                  className={`play-card__item${copiedIp ? ' copied' : ''}`}
                  onClick={() => void copy(SERVER_CONFIG.ip, 'ip')}
                >
                  <span className="play-card__label">IP</span>
                  <code>{SERVER_CONFIG.ip}</code>
                  <span className="play-card__action">
                    <CopyIcon size={14} />
                    {copiedIp ? 'Скопировано' : 'Копировать'}
                  </span>
                </button>

                {!user.codeVerified ? (
                  <button
                    type="button"
                    className={`play-card__item play-card__item--accent${copiedCode ? ' copied' : ''}`}
                    onClick={() => void copy(user.accessCode, 'code')}
                  >
                    <span className="play-card__label">Код доступа</span>
                    <code>{user.accessCode}</code>
                    <span className="play-card__action">
                      <CopyIcon size={14} />
                      {copiedCode ? 'Скопировано' : 'Копировать'}
                    </span>
                  </button>
                ) : (
                  <div className="play-card__item play-card__item--done">
                    <span className="play-card__label">Статус</span>
                    <span className="play-card__done-text">✓ Код активирован</span>
                  </div>
                )}
              </div>

              {user.codeExpiresAt && (
                <AccessCodeTimer expiresAt={user.codeExpiresAt} onExpired={handleCodeExpired} />
              )}

              {!user.codeVerified && (
                <>
                  <p className="play-card__cmd">
                    На сервере: <code>/code {user.accessCode}</code>
                  </p>
                  <p className="play-card__hint">
                    Код меняется каждые 7 дней. После смены снова введите <code>/code</code> на сервере.
                  </p>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => void handleRegenerate()}
                    disabled={regenerating}
                  >
                    {regenerating ? 'Генерация...' : 'Сгенерировать новый код'}
                  </button>
                </>
                )}

              {user.codeVerified && (
                <p className="play-card__hint">
                  Код активирован до смены по таймеру. После обновления кода снова понадобится{' '}
                  <code>/code</code> на сервере.
                </p>
              )}

              <p className="play-card__nick">
                Ник в игре: <strong>{user.username}</strong> — должен совпадать с ником в Minecraft
              </p>
            </div>
          </div>
        )}

        {section === 'account' && (
          <div className="profile-layout__panel profile-layout__panel--stack">
            <div className="card">
              <h3>Обзор аккаунта</h3>
              <div className="profile-group">
                <span className="profile-group__label">Группа на сервере</span>
                <GroupBadge
                  role={user.role}
                  privilegeSlug={user.privilege?.slug}
                  group={user.displayGroup}
                  mediaPlatform={user.mediaPlatform ?? user.privilege?.mediaPlatform}
                  size="lg"
                />
                {user.privilege?.slug === 'vip' && user.privilege.expiresAt ? (
                  <p className="muted profile-group__hint">
                    VIP до {formatSiteDate(user.privilege.expiresAt, { year: undefined })}
                  </p>
                ) : null}
              </div>
              <dl className="info-list info-list--profile">
                <div>
                  <dt>Ник</dt>
                  <dd>{user.username}</dd>
                </div>
                <div className="info-list__email">
                  <dt>Email</dt>
                  <dd className="info-list__break">
                    <div className="profile-email-row">
                      <span>{user.email}</span>
                      {user.emailVerified ? (
                        <span className="profile-email-verified">Подтверждено</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--primary profile-email-row__confirm"
                          onClick={() => setEmailVerifyOpen((open) => !open)}
                        >
                          {emailVerifyOpen ? 'Скрыть' : 'Подтвердить почту'}
                        </button>
                      )}
                    </div>
                    {emailVerifyOpen && !user.emailVerified && (
                      <form
                        className="profile-email-verify"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void (async () => {
                            setVerifyEmailSaving(true);
                            try {
                              const data = await api<AuthResponse>('/auth/verify-email', {
                                method: 'PATCH',
                                body: JSON.stringify({ emailCode: verifyEmailCode }),
                              });
                              applyUpdate(data);
                              setVerifyEmailCode('');
                              setEmailVerifyOpen(false);
                              showToast('Почта подтверждена');
                            } catch (err) {
                              showError(formatApiError(err, 'Ошибка'));
                            } finally {
                              setVerifyEmailSaving(false);
                            }
                          })();
                        }}
                      >
                        <EmailCodeField
                          email={user.email}
                          purpose="verify_email"
                          value={verifyEmailCode}
                          onChange={setVerifyEmailCode}
                          onSent={() => showToast('Код отправлен на почту')}
                          onError={showError}
                          disabled={verifyEmailSaving}
                          botFields={botFields}
                        />
                        <button
                          type="submit"
                          className="btn btn--primary btn--full"
                          disabled={verifyEmailSaving || verifyEmailCode.length !== 6}
                        >
                          {verifyEmailSaving ? 'Проверка...' : 'Подтвердить'}
                        </button>
                      </form>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Роль на сайте</dt>
                  <dd>
                    <GroupBadge role={user.role} size="sm" />
                  </dd>
                </div>
                {user.createdAt && (
                  <div>
                    <dt>Регистрация</dt>
                    <dd>{formatSiteDate(user.createdAt, { year: undefined })}</dd>
                  </div>
                )}
              </dl>
            </div>

            <ProfileNameColorUpsell user={user} />
            <ProfileNameColor user={user} onUpdated={setUserData} />

            <div className="card">
              <SecureAccountForm
                title="Смена ника"
                description="Ник на сайте = ник в Minecraft. После смены потребуется снова активировать код на сервере."
                submitLabel="Сохранить ник"
                onSubmit={(currentPassword) =>
                  api<AuthResponse & { verificationReset?: boolean }>('/auth/username', {
                    method: 'PATCH',
                    body: JSON.stringify({ currentPassword, username: newUsername }),
                  })
                }
                onSuccess={(data) => {
                  applyUpdate(data);
                  setNewUsername('');
                  showToast('Ник обновлён');
                }}
              >
                <label className="field">
                  <span>Новый ник</span>
                  <input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder={user.username}
                    required
                    minLength={3}
                    maxLength={16}
                    pattern="[a-zA-Z0-9_]{3,16}"
                    autoComplete="username"
                  />
                  <small>3–16 символов: латиница, цифры, _</small>
                </label>
                {user.codeVerified && (
                  <div className="alert alert--info">
                    Вы уже прошли верификацию на сервере. После смены ника зайдите с новым ником и снова введите{' '}
                    <code>/code {user.accessCode}</code>
                  </div>
                )}
              </SecureAccountForm>
            </div>

            <div className="card">
              <form
                className="secure-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void (async () => {
                    setEmailSaving(true);
                    try {
                      const data = await api<AuthResponse>('/auth/email', {
                        method: 'PATCH',
                        body: JSON.stringify({
                          currentPassword: emailChangePassword,
                          email: newEmail,
                          emailCode,
                        }),
                      });
                      applyUpdate(data);
                      setNewEmail('');
                      setEmailCode('');
                      setEmailChangePassword('');
                      showToast('Email обновлён');
                    } catch (err) {
                      showError(formatApiError(err, 'Ошибка'));
                    } finally {
                      setEmailSaving(false);
                    }
                  })();
                }}
              >
                <div className="secure-form__head">
                  <h3>Смена email</h3>
                  <p className="secure-form__desc">
                    На новый адрес придёт код подтверждения
                  </p>
                </div>

                <label className="field">
                  <span>Новый email</span>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={user.email}
                    required
                    autoComplete="email"
                  />
                </label>

                <PasswordField
                  label="Текущий пароль"
                  value={emailChangePassword}
                  onChange={setEmailChangePassword}
                  placeholder="Для отправки кода и сохранения"
                  autoComplete="current-password"
                />

                <EmailCodeField
                  email={newEmail}
                  purpose="change_email"
                  currentPassword={emailChangePassword}
                  value={emailCode}
                  onChange={setEmailCode}
                  onSent={() => showToast('Код отправлен на новый email')}
                  onError={showError}
                  disabled={emailSaving}
                  botFields={botFields}
                />

                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={emailSaving || emailCode.length !== 6 || !emailChangePassword}
                >
                  {emailSaving ? 'Сохранение...' : 'Сохранить email'}
                </button>
              </form>
            </div>
          </div>
        )}

        {section === 'security' && (
          <div className="profile-layout__panel profile-layout__panel--stack">
            <div className="card security-card">
              <h3>Защита аккаунта</h3>
              <ul className="security-tips">
                <li>Используйте уникальный пароль, которого нет на других сайтах</li>
                <li>Не сообщайте код доступа и пароль другим игрокам</li>
                <li>Любые изменения профиля требуют подтверждения текущим паролем</li>
                <li>Email подтверждается кодом из письма при регистрации и смене адреса</li>
                <li>После смены пароля, email или ника все другие устройства будут разлогинены</li>
                <li>В разделе «Устройства» можно завершить вход на чужом браузере</li>
                <li>С нового IP при входе нужен код из письма (двухэтапная проверка)</li>
                <li>При подозрительных попытках входа аккаунт временно блокируется</li>
              </ul>
              <button type="button" className="btn btn--ghost logout-btn" onClick={logout}>
                Выйти из аккаунта
              </button>
            </div>

            <WebSessionsPanel />

            <div className="card">
              <SecureAccountForm
                title="Смена пароля"
                submitLabel="Обновить пароль"
                onSubmit={async (currentPassword) => {
                  if (newPassword !== confirmPassword) {
                    throw new ApiError('Пароли не совпадают', 400);
                  }
                  const passwordError = validatePassword(newPassword);
                  if (passwordError) {
                    throw new ApiError(passwordError, 400);
                  }
                  return api<AuthResponse>('/auth/password', {
                    method: 'PATCH',
                    body: JSON.stringify({ currentPassword, newPassword }),
                  });
                }}
                onSuccess={(data) => {
                  applyUpdate(data);
                  setNewPassword('');
                  setConfirmPassword('');
                  showToast('Пароль изменён');
                }}
              >
                <PasswordField
                  label="Новый пароль"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Минимум 8 символов, буквы и цифры"
                  autoComplete="new-password"
                  hint="Не менее 8 символов, буквы и цифры"
                />
                <PasswordField
                  label="Повторите новый пароль"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Ещё раз"
                  autoComplete="new-password"
                />
              </SecureAccountForm>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
