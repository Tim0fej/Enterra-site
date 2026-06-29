import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageShell, useLayoutToast } from '../components/Layout';
import { formatApiError } from '../utils/formatError';
import type { PrivilegeTier } from '../types/players';
import { GroupBadge } from '../components/GroupBadge';
import { getDisplayGroupMeta, type DisplayGroupId } from '../../shared/displayGroup';
import type { UserRole } from '../utils/roles';
import { formatSiteDate } from '../utils/formatDate';
import { usePolling } from '../hooks/usePolling';
import { ADMIN_GUIDE_TITLE } from '../../shared/staffGuide';
import {
  SERVER_DISPLAY_MODE_HINTS,
  SERVER_DISPLAY_MODE_LABELS,
  SERVER_DISPLAY_MODES,
  SERVER_DISPLAY_STATE_LABELS,
  type ServerDisplayMode,
} from '../../shared/serverDisplayStatus';

interface ServerStatusAdminResponse {
  settings: {
    mode: ServerDisplayMode;
    message: string;
    updatedAt: string | null;
  };
  preview: {
    label: string;
    message: string | null;
    displayState: string;
    playersOnline: number;
    playersMax: number | null;
  };
  mcOnline: boolean;
}

interface AdminStats {
  users: number;
  verifiedUsers: number;
  forumTopics: number;
  forumPosts: number;
  openTickets: number;
  minecraftApiKeyConfigured: boolean;
  pluginConfigured: boolean;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  code_verified_at: string | null;
  created_at: string;
  privilege_slug: string | null;
  media_platform: 'youtube' | 'twitch' | 'tiktok' | null;
  displayGroup: DisplayGroupId;
  luckPermsGroup: string;
  online: boolean;
}

interface OnlinePlayerSummary {
  id: number;
  username: string;
  role: UserRole;
  displayGroup: DisplayGroupId;
  privilege_slug: string | null;
  media_platform: 'youtube' | 'twitch' | 'tiktok' | null;
}

interface OnlinePlayersResponse {
  server: {
    online: boolean;
    playersOnline: number;
    playersMax: number | null;
  };
  registeredOnline: OnlinePlayerSummary[];
  guestOnline: string[];
  onlineUserIds: number[];
}

interface PrivilegeAssignment {
  id: number;
  user_id: number;
  username: string;
  tier_slug: string;
  tier_name: string;
  tier_color: string;
  media_platform: 'youtube' | 'twitch' | 'tiktok' | null;
  granted_by_name: string;
  granted_at: string;
  expires_at: string | null;
}

export function AdminPage() {
  const { showToast, showError } = useLayoutToast();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tiers, setTiers] = useState<PrivilegeTier[]>([]);
  const [privileges, setPrivileges] = useState<PrivilegeAssignment[]>([]);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantTierId, setGrantTierId] = useState('');
  const [grantMonths, setGrantMonths] = useState('1');
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [serverMode, setServerMode] = useState<ServerDisplayMode>('auto');
  const [serverMessage, setServerMessage] = useState('');
  const [serverPreview, setServerPreview] = useState<ServerStatusAdminResponse['preview'] | null>(null);
  const [serverMcOnline, setServerMcOnline] = useState<boolean | null>(null);
  const [serverSaving, setServerSaving] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayerSummary[]>([]);
  const [guestOnline, setGuestOnline] = useState<string[]>([]);
  const [mcPlayersOnline, setMcPlayersOnline] = useState<number | null>(null);
  const [mcPlayersMax, setMcPlayersMax] = useState<number | null>(null);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  const loadOnlinePlayers = () =>
    api<OnlinePlayersResponse>('/admin/online-players')
      .then((data) => {
        setOnlinePlayers(data.registeredOnline);
        setGuestOnline(data.guestOnline);
        setMcPlayersOnline(data.server.playersOnline);
        setMcPlayersMax(data.server.playersMax);
        const onlineIds = new Set(data.onlineUserIds);
        setUsers((prev) =>
          prev.map((user) => ({
            ...user,
            online: onlineIds.has(user.id),
          })),
        );
      })
      .catch(() => {
        setOnlinePlayers([]);
        setGuestOnline([]);
      });

  const loadServerStatus = () =>
    api<ServerStatusAdminResponse>('/admin/server-status')
      .then((data) => {
        setServerMode(data.settings.mode);
        setServerMessage(data.settings.message);
        setServerPreview(data.preview);
        setServerMcOnline(data.mcOnline);
      })
      .catch(() => {
        setServerPreview(null);
        setServerMcOnline(null);
      });

  const previewLabel =
    serverMode === 'maintenance'
      ? SERVER_DISPLAY_STATE_LABELS.maintenance
      : serverPreview?.label ?? '—';
  const previewMessage =
    serverMode === 'maintenance'
      ? serverMessage.trim() || null
      : serverPreview?.message ?? null;

  const load = () => {
    void Promise.allSettled([
      api<AdminStats>('/admin/stats'),
      api<AdminUser[]>('/admin/users'),
      api<PrivilegeTier[]>('/admin/privilege-tiers'),
      api<PrivilegeAssignment[]>('/admin/privileges'),
      loadServerStatus(),
      loadOnlinePlayers(),
    ]).then((results) => {
      const [statsResult, usersResult, tiersResult, privResult] = results;
      const failures = results.filter((r) => r.status === 'rejected').length;
      if (statsResult.status === 'fulfilled') setStats(statsResult.value);
      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value.map((user) => ({ ...user, online: false })));
      }
      if (tiersResult.status === 'fulfilled') setTiers(tiersResult.value);
      if (privResult.status === 'fulfilled') setPrivileges(privResult.value);
      if (failures > 0) {
        showError('Часть данных не загрузилась. Обновите страницу или повторите позже.');
      }
    }).finally(() => setLoading(false));
  };

  const saveServerStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerSaving(true);
    try {
      const data = await api<ServerStatusAdminResponse>('/admin/server-status', {
        method: 'PATCH',
        body: JSON.stringify({ mode: serverMode, message: serverMessage }),
      });
      setServerMode(data.settings.mode);
      setServerMessage(data.settings.message);
      setServerPreview(data.preview);
      setServerMcOnline(data.mcOnline);
      showToast('Статус сервера обновлён');
    } catch (err) {
      showError(formatApiError(err, 'Ошибка сохранения'));
    } finally {
      setServerSaving(false);
    }
  };

  useEffect(load, []);
  usePolling(loadOnlinePlayers, 15_000, !loading);

  const onlineRegisteredCount = onlinePlayers.length;

  const changeRole = async (userId: number, role: UserRole) => {
    try {
      await api(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      showToast('Роль обновлена');
      load();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    }
  };

  const resetVerification = async (userId: number) => {
    if (!confirm('Сбросить верификацию?')) return;
    try {
      await api(`/admin/users/${userId}/reset-verification`, { method: 'PATCH' });
      showToast('Верификация сброшена');
      load();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    }
  };

  const regenerateCode = async (userId: number) => {
    if (!confirm('Сгенерировать новый код?')) return;
    try {
      const data = await api<{ accessCode: string }>(`/admin/users/${userId}/regenerate-code`, {
        method: 'PATCH',
      });
      void data;
      showToast('Новый код сгенерирован');
      load();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (
      !confirm(
        `Удалить аккаунт ${username}? Будут удалены тикеты, сообщения на форуме и привилегии.`,
      )
    ) {
      return;
    }

    try {
      await api(`/admin/users/${userId}`, { method: 'DELETE' });
      showToast(`Аккаунт ${username} удалён`);
      if (grantUserId === String(userId)) {
        setGrantUserId('');
      }
      load();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    }
  };

  const grantPrivilege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId || !grantTierId) return;
    const selectedTier = tiers.find((t) => String(t.id) === grantTierId);
    const body: Record<string, unknown> = {
      userId: Number(grantUserId),
      tierId: Number(grantTierId),
    };
    if (selectedTier?.slug === 'vip') {
      body.months = Number(grantMonths);
    }
    try {
      await api('/admin/privileges', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      showToast('Привилегия выдана — в игре обновится автоматически');
      load();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    }
  };

  const selectedGrantTier = tiers.find((t) => String(t.id) === grantTierId);

  const revokePrivilege = async (userId: number, username: string) => {
    if (!confirm(`Снять привилегию у ${username}?`)) return;
    try {
      await api(`/admin/privileges/${userId}`, { method: 'DELETE' });
      showToast('Привилегия снята');
      load();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    }
  };

  const privByUser = useMemo(
    () => new Map(privileges.map((p) => [p.user_id, p])),
    [privileges],
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    let list = users;

    if (showOnlineOnly) {
      list = list.filter((u) => u.online);
    }

    if (!q) return list;

    const roleLabels: Record<UserRole, string> = {
      user: 'игрок',
      moderator: 'модератор',
      admin: 'админ',
    };

    return list.filter((u) => {
      const priv = privByUser.get(u.id);
      const haystack = [
        u.username,
        u.email,
        roleLabels[u.role],
        priv?.tier_name ?? '',
        getDisplayGroupMeta(u.displayGroup).label,
        u.luckPermsGroup,
        u.online ? 'онлайн' : '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, userSearch, privByUser, showOnlineOnly]);

  if (loading) {
    return (
      <PageShell title="Админ-панель">
        <p className="muted">Загрузка...</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Админ-панель" subtitle="Управление сайтом, игроками и привилегиями" wide>
      <div className="staff-nav">
        <Link to="/staff-guide" className="link-btn">{ADMIN_GUIDE_TITLE}</Link>
        <Link to="/moder" className="link-btn">Панель модератора →</Link>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card card">
            <span className="stat-card__value">{stats.users}</span>
            <span className="stat-card__label">Пользователей</span>
          </div>
          <div className="stat-card card">
            <span className="stat-card__value">{stats.verifiedUsers}</span>
            <span className="stat-card__label">На сервере</span>
          </div>
          <div className="stat-card card">
            <span className="stat-card__value">{privileges.length}</span>
            <span className="stat-card__label">С привилегией</span>
          </div>
          <div className="stat-card card">
            <span className="stat-card__value">{stats.openTickets}</span>
            <span className="stat-card__label">Тикетов</span>
          </div>
          <div className="stat-card card stat-card--online">
            <span className="stat-card__value">{onlineRegisteredCount}</span>
            <span className="stat-card__label">
              В сети
              {mcPlayersOnline !== null ? (
                <span className="stat-card__sub">
                  {' '}
                  · {mcPlayersOnline}/{mcPlayersMax ?? '?'} на сервере
                </span>
              ) : null}
            </span>
          </div>
        </div>
      )}

      <div className="card staff-section admin-online-players">
        <h3>Сейчас на сервере</h3>
        <p className="card__hint">
          Зарегистрированные на сайте игроки в сети. Обновляется каждые 15 секунд.
        </p>

        {onlinePlayers.length === 0 && guestOnline.length === 0 ? (
          <p className="muted admin-online-players__empty">Сейчас никого нет в игре</p>
        ) : (
          <div className="admin-online-players__lists">
            {onlinePlayers.length > 0 ? (
              <div className="admin-online-players__group">
                <h4 className="admin-online-players__subtitle">
                  На сайте ({onlinePlayers.length})
                </h4>
                <ul className="admin-online-players__chips">
                  {onlinePlayers.map((player) => (
                    <li key={player.id} className="admin-online-players__chip">
                      <span className="admin-online-players__dot" aria-hidden="true" />
                      <span className="admin-online-players__name">{player.username}</span>
                      <GroupBadge
                        role={player.role}
                        privilegeSlug={player.privilege_slug}
                        group={player.displayGroup}
                        mediaPlatform={player.media_platform}
                        size="sm"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {guestOnline.length > 0 ? (
              <div className="admin-online-players__group">
                <h4 className="admin-online-players__subtitle">
                  Без аккаунта на сайте ({guestOnline.length})
                </h4>
                <ul className="admin-online-players__chips admin-online-players__chips--guests">
                  {guestOnline.map((name) => (
                    <li key={name} className="admin-online-players__chip admin-online-players__chip--guest">
                      <span className="admin-online-players__dot" aria-hidden="true" />
                      <span className="admin-online-players__name">{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="card staff-section admin-server-status">
        <h3>Статус сервера на сайте</h3>
        <p className="card__hint">
          Управляет тем, что видят игроки на главной, и доступом на Minecraft-сервер.
          Реальный мониторинг:{' '}
          {serverMcOnline === null ? '—' : serverMcOnline ? 'сервер отвечает' : 'не отвечает'}.
        </p>

        <form className="admin-server-status__form" onSubmit={(e) => void saveServerStatus(e)}>
          <div className="admin-server-status__modes">
            {SERVER_DISPLAY_MODES.map((mode) => (
              <label key={mode} className="admin-server-status__mode">
                <input
                  type="radio"
                  name="serverMode"
                  value={mode}
                  checked={serverMode === mode}
                  onChange={() => setServerMode(mode)}
                />
                <span>{SERVER_DISPLAY_MODE_LABELS[mode]}</span>
              </label>
            ))}
          </div>

          <p className="muted admin-server-status__hint">{SERVER_DISPLAY_MODE_HINTS[serverMode]}</p>

          <label className="field">
            <span>Сообщение на сайте (необязательно)</span>
            <input
              value={serverMessage}
              onChange={(e) => setServerMessage(e.target.value)}
              placeholder={
                serverMode === 'maintenance'
                  ? 'Например: Обновление до 1.21.5 — это же сообщение увидят игроки при попытке зайти'
                  : 'Оставьте пустым для стандартного текста'
              }
              maxLength={200}
            />
          </label>

          {serverPreview ? (
            <p className="admin-server-status__preview">
              Сейчас на сайте: <strong>{previewLabel}</strong>
              {previewMessage ? (
                <>
                  <br />
                  <span className="muted">{previewMessage}</span>
                </>
              ) : null}
              {serverMode === 'auto' || serverMode === 'online' ? (
                <span className="muted">
                  {' '}
                  · игроков {serverPreview.playersOnline}/{serverPreview.playersMax ?? '?'}
                </span>
              ) : null}
            </p>
          ) : null}

          <button type="submit" className="btn btn--primary" disabled={serverSaving}>
            {serverSaving ? 'Сохранение...' : 'Сохранить статус'}
          </button>
        </form>
      </div>

      <div className="card staff-section">
        <h3>Выдача привилегий</h3>
        <p className="card__hint">Только администраторы. Привилегии видны в профиле игрока.</p>

        <form className="grant-form" onSubmit={(e) => void grantPrivilege(e)}>
          <div className="grant-form__row">
            <label className="field grant-form__field">
              <span>Игрок</span>
              <select value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} required>
                <option value="">Выбери игрока</option>
                {[...users]
                  .sort((a, b) => a.username.localeCompare(b.username, 'ru'))
                  .map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </label>

            <label className="field grant-form__field">
              <span>Привилегия</span>
              <select value={grantTierId} onChange={(e) => setGrantTierId(e.target.value)} required>
                <option value="">Выбери тип</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>

            {selectedGrantTier?.slug === 'vip' ? (
              <label className="field grant-form__field">
                <span>Срок VIP</span>
                <select value={grantMonths} onChange={(e) => setGrantMonths(e.target.value)} required>
                  <option value="1">1 месяц</option>
                  <option value="3">3 месяца</option>
                  <option value="6">6 месяцев</option>
                </select>
              </label>
            ) : null}

            <button type="submit" className="btn btn--primary grant-form__submit">Выдать</button>
          </div>

          {grantTierId && selectedGrantTier && (
            <div className="grant-form__preview">
              <GroupBadge role="user" privilegeSlug={selectedGrantTier.slug} size="md" />
              <p className="grant-form__hint muted">{selectedGrantTier.description}</p>
            </div>
          )}

        </form>

        {privileges.length > 0 && (
          <div className="grant-list">
            <h4 className="grant-list__title">Активные привилегии</h4>
            <div className="table-wrap">
              <table className="data-table data-table--staff">
              <thead>
                <tr>
                  <th>Игрок</th>
                  <th>Привилегия</th>
                  <th>Выдал</th>
                  <th>Выдано</th>
                  <th>До</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {privileges.map((p) => (
                  <tr key={p.id}>
                    <td>{p.username}</td>
                    <td>
                      <GroupBadge
                        role="user"
                        privilegeSlug={p.tier_slug}
                        mediaPlatform={p.media_platform}
                        size="sm"
                      />
                    </td>
                    <td>{p.granted_by_name}</td>
                    <td>{formatSiteDate(p.granted_at, { year: undefined })}</td>
                    <td>
                      {p.expires_at
                        ? formatSiteDate(p.expires_at, { year: undefined })
                        : '—'}
                    </td>
                    <td>
                      <button type="button" className="link-btn link-btn--danger" onClick={() => void revokePrivilege(p.user_id, p.username)}>
                        Снять
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <div className="card staff-section">
        <h3>Пользователи</h3>
        <p className="card__hint">
          {userSearch.trim() || showOnlineOnly
            ? `${filteredUsers.length} из ${users.length}`
            : `${users.length} зарегистрировано на сайте`}
          {onlineRegisteredCount > 0 ? ` · ${onlineRegisteredCount} в сети` : ''}
        </p>

        <div className="staff-table-panel">
          <div className="staff-table-toolbar">
            <input
              type="search"
              className="staff-search"
              placeholder="Поиск по нику, email, роли…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              aria-label="Поиск пользователей"
            />
            <label className="admin-online-filter">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
              />
              <span>Только в сети</span>
            </label>
            {userSearch.trim() ? (
              <button
                type="button"
                className="link-btn staff-search__clear"
                onClick={() => setUserSearch('')}
              >
                Сбросить
              </button>
            ) : null}
          </div>
          <div className="table-wrap">
            <table className="data-table data-table--staff users-table">
            <thead>
              <tr>
                <th>Ник</th>
                <th>Почта</th>
                <th>Роль</th>
                <th className="users-table__center">Онлайн</th>
                <th className="users-table__center">Сервер</th>
                <th className="users-table__center">Группа</th>
                <th className="users-table__actions-head">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="users-table__no-results">
                    Никого не найдено
                  </td>
                </tr>
              ) : filteredUsers.map((u) => {
                return (
                  <tr key={u.id} className={u.online ? 'users-table__row--online' : undefined}>
                    <td className="users-table__nick">{u.username}</td>
                    <td className="users-table__email" title={u.email}>{u.email}</td>
                    <td className="users-table__role">
                      <select
                        className="staff-select"
                        value={u.role}
                        onChange={(e) => void changeRole(u.id, e.target.value as UserRole)}
                      >
                        <option value="user">Игрок</option>
                        <option value="moderator">Модератор</option>
                        <option value="admin">Админ</option>
                      </select>
                    </td>
                    <td className="users-table__center">
                      {u.online ? (
                        <span className="online-badge online-badge--yes" title="Сейчас на сервере">●</span>
                      ) : (
                        <span className="online-badge online-badge--no" title="Не в игре">—</span>
                      )}
                    </td>
                    <td className="users-table__center">
                      {u.code_verified_at ? (
                        <span className="verify-badge verify-badge--ok" title="Подтвердил вход на сервере">✓</span>
                      ) : (
                        <span className="verify-badge verify-badge--no" title="Ещё не заходил на сервер">—</span>
                      )}
                    </td>
                    <td className="users-table__center users-table__group">
                      <GroupBadge
                        role={u.role}
                        privilegeSlug={u.privilege_slug}
                        group={u.displayGroup}
                        mediaPlatform={u.media_platform}
                        size="sm"
                      />
                    </td>
                    <td className="users-table__actions">
                      <div className="table-actions">
                      <button
                        type="button"
                        className="link-btn table-actions__btn"
                        onClick={() => void resetVerification(u.id)}
                        title="Сбросить верификацию на сервере"
                      >
                        Сброс вериф.
                      </button>
                      <span className="table-actions__sep" aria-hidden="true">·</span>
                      <button
                        type="button"
                        className="link-btn table-actions__btn"
                        onClick={() => void regenerateCode(u.id)}
                        title="Сгенерировать новый код доступа"
                      >
                        Новый код
                      </button>
                      {currentUser?.id !== u.id ? (
                        <>
                          <span className="table-actions__sep" aria-hidden="true">·</span>
                          <button
                            type="button"
                            className="link-btn link-btn--danger table-actions__btn"
                            onClick={() => void deleteUser(u.id, u.username)}
                            title="Удалить аккаунт"
                          >
                            Удалить
                          </button>
                        </>
                      ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
