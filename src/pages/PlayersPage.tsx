import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { PageShell } from '../components/Layout';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { GroupBadge } from '../components/GroupBadge';
import type { PlayerListItem, PlayersResponse } from '../types/players';

type Filter = 'all' | 'online' | 'verified';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'online', label: 'Онлайн' },
  { id: 'verified', label: 'На сервере' },
];

function PlayerRow({ player, index }: { player: PlayerListItem; index: number }) {
  const ref = useScrollAnimation<HTMLDivElement>(index * 60);

  return (
    <div className="player-row card" ref={ref}>
      <div className="player-row__avatar" aria-hidden>
        {player.online ? '🟢' : '⛏'}
      </div>
      <div className="player-row__info">
        <div className="player-row__name">
          <span>{player.username}</span>
          <GroupBadge
            role={player.role}
            privilegeSlug={player.privilegeSlug}
            group={player.displayGroup}
            mediaPlatform={player.mediaPlatform}
            size="sm"
          />
        </div>
        <p className="player-row__meta">
          {player.online && <span className="player-row__online">Сейчас в игре</span>}
          {player.verified ? (
            <span>Заходил на сервер</span>
          ) : (
            <span className="muted">Только регистрация</span>
          )}
          {' · '}
          с {new Date(player.registeredAt).toLocaleDateString('ru')}
        </p>
      </div>
    </div>
  );
}

export function PlayersPage() {
  const [data, setData] = useState<PlayersResponse | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<PlayersResponse>('/players')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === 'online') return data.players.filter((p) => p.online);
    if (filter === 'verified') return data.players.filter((p) => p.verified);
    return data.players;
  }, [data, filter]);

  return (
    <PageShell
      title="Игроки"
      subtitle={
        data
          ? `${data.total} зарегистрировано · ${data.onlineCount} онлайн · ${data.verifiedCount} на сервере`
          : 'Список зарегистрированных игроков'
      }
      wide
    >
      {loading ? (
        <p className="muted">Загрузка...</p>
      ) : !data ? (
        <p className="muted">Не удалось загрузить список</p>
      ) : (
        <>
          <div className="players-stats">
            <div className="stat-card card">
              <span className="stat-card__value">{data.server.playersOnline}</span>
              <span className="stat-card__label">Сейчас в игре</span>
            </div>
            <div className="stat-card card">
              <span className="stat-card__value">{data.total}</span>
              <span className="stat-card__label">Зарегистрировано</span>
            </div>
            <div className="stat-card card">
              <span className="stat-card__value">{data.verifiedCount}</span>
              <span className="stat-card__label">Подтвердили вход</span>
            </div>
          </div>

          <div className="filter-tabs">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`filter-tabs__btn${filter === f.id ? ' active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="card empty-state">
              <p>Никого не найдено</p>
            </div>
          ) : (
            <div className="player-list">
              {filtered.map((p, index) => (
                <PlayerRow key={p.id} player={p} index={index} />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
