import { useState } from 'react';
import { api, ApiError } from '../api/client';
import { PageShell } from '../components/Layout';
import { CopyIcon } from '../components/CopyIcon';
import { useAuth } from '../context/AuthContext';
import { useLayoutToast } from '../components/Layout';
import { SERVER_CONFIG } from '../config';
import { GroupBadge } from '../components/GroupBadge';
import { ROLE_LABELS } from '../utils/roles';

export function ProfilePage() {
  const { user, setUserData } = useAuth();
  const { showToast } = useLayoutToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!user) return null;

  const copy = async (text: string, type: 'code' | 'ip') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedIp(true);
        setTimeout(() => setCopiedIp(false), 2000);
      }
      showToast(type === 'code' ? 'Код скопирован!' : 'IP скопирован!');
    } catch {
      showToast('Не удалось скопировать');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Сгенерировать новый код? Старый перестанет работать.')) return;
    setRegenerating(true);
    try {
      const data = await api<{ accessCode: string }>('/auth/regenerate-code', { method: 'POST' });
      setUserData({ ...user, accessCode: data.accessCode });
      showToast('Новый код сгенерирован');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Ошибка');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <PageShell title="Профиль" subtitle={user.username}>
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

        {!user.codeVerified && (
          <>
            <p className="play-card__cmd">
              На сервере: <code>/code {user.accessCode}</code>
            </p>
            <button type="button" className="link-btn" onClick={() => void handleRegenerate()} disabled={regenerating}>
              {regenerating ? 'Генерация...' : 'Сгенерировать новый код'}
            </button>
          </>
        )}

        <p className="play-card__nick">
          Ник в игре: <strong>{user.username}</strong> — должен совпадать с Minecraft
        </p>
      </div>

        <div className="card">
          <h3>Аккаунт</h3>
          <div className="profile-group">
            <span className="profile-group__label">Группа на сервере</span>
            <GroupBadge
              role={user.role}
              privilegeSlug={user.privilege?.slug}
              group={user.displayGroup}
              mediaPlatform={user.mediaPlatform ?? user.privilege?.mediaPlatform}
              size="lg"
            />
          </div>
          <dl className="info-list">
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Роль на сайте</dt><dd>{ROLE_LABELS[user.role]}</dd></div>
        </dl>
      </div>
    </PageShell>
  );
}
