import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatApiError } from '../utils/formatError';
import type { WebSession } from '../types/auth';

import { formatSiteDateTime } from '../utils/formatDate';

function formatSessionDate(value: string): string {
  return formatSiteDateTime(value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) || value;
}

export function WebSessionsPanel() {
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<WebSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setError(null);
    try {
      const data = await api<{ sessions: WebSession[] }>('/auth/sessions');
      setSessions(data.sessions);
    } catch (err) {
      setError(formatApiError(err, 'Не удалось загрузить устройства'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const revokeSession = async (session: WebSession) => {
    setRevokingId(session.id);
    setError(null);
    try {
      const data = await api<{ ok: boolean; current?: boolean }>(`/auth/sessions/${session.id}`, {
        method: 'DELETE',
      });
      if (data.current) {
        logout();
        return;
      }
      setSessions((prev) => prev.filter((item) => item.id !== session.id));
    } catch (err) {
      setError(formatApiError(err, 'Не удалось завершить сессию'));
    } finally {
      setRevokingId(null);
    }
  };

  const revokeOthers = async () => {
    setRevokingOthers(true);
    setError(null);
    try {
      await api('/auth/sessions/revoke-others', { method: 'POST' });
      await loadSessions();
    } catch (err) {
      setError(formatApiError(err, 'Не удалось завершить другие сессии'));
    } finally {
      setRevokingOthers(false);
    }
  };

  const otherCount = sessions.filter((session) => !session.current).length;

  return (
    <div className="card web-sessions">
      <div className="web-sessions__head">
        <div>
          <h3>Устройства</h3>
          <p className="web-sessions__desc muted">
            Активные входы в аккаунт с браузеров и устройств. Завершите сессию, если не узнаёте устройство.
          </p>
        </div>
        {otherCount > 0 && (
          <button
            type="button"
            className="btn btn--ghost btn--small"
            disabled={revokingOthers || loading}
            onClick={() => void revokeOthers()}
          >
            {revokingOthers ? 'Выход...' : 'Выйти на других'}
          </button>
        )}
      </div>

      {error && <p className="web-sessions__error">{error}</p>}

      {loading ? (
        <p className="muted">Загрузка...</p>
      ) : sessions.length === 0 ? (
        <p className="muted">
          Список появится после следующего входа. Старые сессии без привязки к устройству уже не отображаются.
        </p>
      ) : (
        <ul className="web-sessions__list">
          {sessions.map((session) => (
            <li key={session.id} className={`web-sessions__item${session.current ? ' web-sessions__item--current' : ''}`}>
              <div className="web-sessions__info">
                <strong>{session.deviceLabel}</strong>
                {session.current && <span className="web-sessions__badge">Это устройство</span>}
                <span className="web-sessions__meta muted">
                  {session.ipMasked ? `IP ${session.ipMasked} · ` : ''}
                  активность {formatSessionDate(session.lastSeenAt)}
                </span>
                <span className="web-sessions__meta muted">
                  Первый вход {formatSessionDate(session.createdAt)}
                </span>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--small web-sessions__revoke"
                disabled={revokingId === session.id}
                onClick={() => void revokeSession(session)}
              >
                {revokingId === session.id ? '…' : session.current ? 'Выйти' : 'Завершить'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
