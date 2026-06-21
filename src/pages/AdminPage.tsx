import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageShell } from '../components/Layout';
import { useLayoutToast } from '../components/Layout';
import type { PrivilegeTier } from '../types/players';
import { GroupBadge } from '../components/GroupBadge';
import { getDisplayGroupMeta, type DisplayGroupId } from '../../shared/displayGroup';
import type { UserRole } from '../utils/roles';

interface AdminStats {
  users: number;
  verifiedUsers: number;
  forumTopics: number;
  forumPosts: number;
  openTickets: number;
  minecraftApiKey: string;
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
}

export function AdminPage() {
  const { showToast } = useLayoutToast();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tiers, setTiers] = useState<PrivilegeTier[]>([]);
  const [privileges, setPrivileges] = useState<PrivilegeAssignment[]>([]);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantTierId, setGrantTierId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const load = () => {
    setError('');
    void Promise.all([
      api<AdminStats>('/admin/stats'),
      api<AdminUser[]>('/admin/users'),
      api<PrivilegeTier[]>('/admin/privilege-tiers'),
      api<PrivilegeAssignment[]>('/admin/privileges'),
    ])
      .then(([statsData, usersData, tiersData, privData]) => {
        setStats(statsData);
        setUsers(usersData);
        setTiers(tiersData);
        setPrivileges(privData);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Ошибка загрузки');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeRole = async (userId: number, role: UserRole) => {
    try {
      await api(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      showToast('Роль обновлена');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  const resetVerification = async (userId: number) => {
    if (!confirm('Сбросить верификацию?')) return;
    try {
      await api(`/admin/users/${userId}/reset-verification`, { method: 'PATCH' });
      showToast('Верификация сброшена');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  const regenerateCode = async (userId: number) => {
    if (!confirm('Сгенерировать новый код?')) return;
    try {
      const data = await api<{ accessCode: string }>(`/admin/users/${userId}/regenerate-code`, {
        method: 'PATCH',
      });
      showToast(`Новый код: ${data.accessCode}`);
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Ошибка');
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
      showToast(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  const grantPrivilege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId || !grantTierId) return;
    try {
      await api('/admin/privileges', {
        method: 'POST',
        body: JSON.stringify({
          userId: Number(grantUserId),
          tierId: Number(grantTierId),
        }),
      });
      showToast('Привилегия выдана — в игре обновится автоматически');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Ошибка');
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
      showToast(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  const privByUser = useMemo(
    () => new Map(privileges.map((p) => [p.user_id, p])),
    [privileges],
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;

    const roleLabels: Record<UserRole, string> = {
      user: 'игрок',
      moderator: 'модератор',
      admin: 'админ',
    };

    return users.filter((u) => {
      const priv = privByUser.get(u.id);
      const haystack = [
        u.username,
        u.email,
        roleLabels[u.role],
        priv?.tier_name ?? '',
        getDisplayGroupMeta(u.displayGroup).label,
        u.luckPermsGroup,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, userSearch, privByUser]);

  if (loading) {
    return (
      <PageShell title="Админ-панель">
        <p className="muted">Загрузка...</p>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Админ-панель">
        <div className="alert alert--error">{error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Админ-панель" subtitle="Управление сайтом, игроками и привилегиями" wide>
      <div className="staff-nav">
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
        </div>
      )}

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
                  <th>Дата</th>
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
                    <td>{new Date(p.granted_at).toLocaleDateString('ru')}</td>
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
          {userSearch.trim()
            ? `${filteredUsers.length} из ${users.length}`
            : `${users.length} зарегистрировано на сайте`}
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
                <th className="users-table__center">Сервер</th>
                <th className="users-table__center">Группа</th>
                <th className="users-table__actions-head">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="users-table__no-results">
                    Никого не найдено
                  </td>
                </tr>
              ) : filteredUsers.map((u) => {
                return (
                  <tr key={u.id}>
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
