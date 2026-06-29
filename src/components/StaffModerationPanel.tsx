import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useLayoutError, useLayoutToast } from './Layout';
import {
  MODERATION_ACTION_LABELS,
  PUNISHMENT_TYPE_LABELS,
  type ModerationActionType,
  type PunishmentType,
} from '../../shared/moderation';
import type {
  ModerationHistoryEntry,
  ModerationPanelData,
  PunishmentEntry,
} from '../types/moderation';
import { formatApiError } from '../utils/formatError';
import { formatSiteDateTime } from '../utils/formatDate';

const ACTION_ICONS: Record<ModerationActionType, string> = {
  ban: '⛔',
  unban: '✓',
  mute: '🔇',
  unmute: '🔊',
  warn: '⚠',
  unwarn: '○',
  kick: '↩',
};

const ACTION_ORDER: ModerationActionType[] = [
  'ban',
  'unban',
  'mute',
  'unmute',
  'warn',
  'unwarn',
  'kick',
];

const ACTION_STATUS: Record<ModerationHistoryEntry['status'], string> = {
  pending: 'В очереди',
  done: 'Выполнено',
  failed: 'Ошибка',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return formatSiteDateTime(value) || value;
}

function formatExpires(value: string | null): string {
  if (!value) return 'Навсегда';
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return 'Навсегда';
  return formatSiteDateTime(new Date(ms).toISOString());
}

export function StaffModerationPanel() {
  const { showToast } = useLayoutToast();
  const { showError } = useLayoutError();
  const [data, setData] = useState<ModerationPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [punishmentTab, setPunishmentTab] = useState<PunishmentType>('ban');

  const [targetUsername, setTargetUsername] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7d');
  const [action, setAction] = useState<ModerationActionType>('ban');

  const load = useCallback(() => {
    setLoading(true);
    void Promise.all([
      api<{ punishments: PunishmentEntry[] }>('/moderation/punishments'),
      api<{ history: ModerationHistoryEntry[] }>('/moderation/history'),
    ])
      .then(([punishments, history]) => {
        setData({
          purchases: [],
          punishments: punishments.punishments,
          history: history.history,
        });
      })
      .catch((err) => {
        setData(null);
        showError(formatApiError(err, 'Не удалось загрузить модерацию'));
      })
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPunishments = useMemo(
    () => (data?.punishments ?? []).filter((item) => item.type === punishmentTab),
    [data, punishmentTab],
  );

  const submitAction = async (override?: {
    action: ModerationActionType;
    targetUsername: string;
    duration?: string | null;
    reason?: string | null;
  }) => {
    const payload = override ?? {
      action,
      targetUsername: targetUsername.trim(),
      duration: ['ban', 'mute'].includes(action) && duration.trim() ? duration.trim() : null,
      reason: reason.trim() || null,
    };

    if (!payload.targetUsername) {
      showError('Укажите ник игрока');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api<{ message: string }>('/moderation/actions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast(result.message);
      if (!override) {
        setTargetUsername('');
        setReason('');
      }
      load();
    } catch (err) {
      showError(formatApiError(err, 'Не удалось выполнить действие'));
    } finally {
      setSubmitting(false);
    }
  };

  const quickAction = (type: ModerationActionType, username: string) => {
    void submitAction({ action: type, targetUsername: username, reason: null, duration: null });
  };

  if (loading) {
    return <p className="muted">Загрузка модерации…</p>;
  }

  if (!data) {
    return (
      <div className="card empty-state">
        <p className="muted">Не удалось загрузить данные модерации</p>
        <button type="button" className="btn btn--primary btn--small" onClick={load}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="mod-panel">
      <section className="staff-section">
        <h2 className="mod-panel__title">Наказание через сайт</h2>
        <p className="muted mod-panel__subtitle">
          Команда уходит на сервер через LiteBans · команда сервера (moder/admin/dev) защищена
        </p>

        <div className="pixel-panel mod-panel__form">
          <div className="mod-actions">
            {ACTION_ORDER.map((item) => (
              <button
                key={item}
                type="button"
                className={`mod-actions__item${action === item ? ' mod-actions__item--active' : ''}`}
                onClick={() => setAction(item)}
              >
                <span className="mod-actions__icon" aria-hidden="true">
                  {ACTION_ICONS[item]}
                </span>
                <span>{MODERATION_ACTION_LABELS[item]}</span>
              </button>
            ))}
          </div>

          <div className="form mod-form">
            <div className="mod-form__grid">
              <label className="field">
                <span>Ник игрока</span>
                <input
                  type="text"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  placeholder="Steve"
                  maxLength={16}
                  autoComplete="off"
                />
              </label>
              {action === 'ban' || action === 'mute' ? (
                <label className="field">
                  <span>Срок</span>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="7d — пусто = навсегда"
                  />
                  <small>1h, 7d, 30d</small>
                </label>
              ) : null}
              <label className="field mod-form__reason">
                <span>Причина</span>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Нарушение правил"
                />
              </label>
            </div>
            <button
              type="button"
              className="btn btn--primary mod-form__submit"
              disabled={submitting}
              onClick={() => void submitAction()}
            >
              {submitting ? 'Отправка…' : 'Применить на сервере'}
            </button>
          </div>
        </div>
      </section>

      <section className="staff-section">
        <h2 className="mod-panel__title">Активные наказания</h2>
        <div className="mod-tabs">
          {(['ban', 'mute', 'warn'] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`mod-tabs__item${punishmentTab === type ? ' mod-tabs__item--active' : ''}`}
              onClick={() => setPunishmentTab(type)}
            >
              {PUNISHMENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        {filteredPunishments.length ? (
          <div className="mod-list">
            {filteredPunishments.map((item) => (
              <article key={`${item.type}-${item.id}`} className="mod-card">
                <div className="mod-card__head">
                  <span className="mod-card__user">{item.targetUsername}</span>
                  <span className="mod-card__type">{PUNISHMENT_TYPE_LABELS[item.type]}</span>
                </div>
                <p className="mod-card__reason">{item.reason || 'Без причины'}</p>
                <p className="muted mod-card__meta">
                  {item.staffName ? `Выдал: ${item.staffName}` : 'Модератор не указан'}
                  {item.type !== 'warn' ? ` · до ${formatExpires(item.expiresAt)}` : ''}
                </p>
                <div className="mod-card__actions">
                  {item.type === 'ban' ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      disabled={submitting}
                      onClick={() => quickAction('unban', item.targetUsername)}
                    >
                      Разбан
                    </button>
                  ) : null}
                  {item.type === 'mute' ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      disabled={submitting}
                      onClick={() => quickAction('unmute', item.targetUsername)}
                    >
                      Снять мут
                    </button>
                  ) : null}
                  {item.type === 'warn' ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      disabled={submitting}
                      onClick={() => quickAction('unwarn', item.targetUsername)}
                    >
                      Снять warn
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card shop-category__empty mod-panel__empty">
            <p className="muted">
              Нет активных {PUNISHMENT_TYPE_LABELS[punishmentTab].toLowerCase()}ов — обновление с сервера ~25 сек
            </p>
          </div>
        )}
      </section>

      <section className="staff-section">
        <h2 className="mod-panel__title">История с сайта</h2>
        {data.history.length ? (
          <div className="mod-history">
            {data.history.map((row) => (
              <article key={row.id} className="mod-history__item">
                <div className="mod-history__main">
                  <span className="mod-history__action">
                    {row.actionLabel}
                    {row.duration ? ` · ${row.duration}` : ''}
                  </span>
                  <span className="mod-history__target">{row.targetUsername}</span>
                </div>
                <div className="mod-history__meta">
                  <span className="muted">{row.staffUsername}</span>
                  <span className={`badge badge--${row.status === 'done' ? 'verified' : row.status === 'failed' ? 'closed' : 'pending'}`}>
                    {ACTION_STATUS[row.status]}
                  </span>
                  <span className="muted">{formatDate(row.processedAt ?? row.createdAt)}</span>
                </div>
                {row.errorMessage ? (
                  <p className="muted mod-history__error">{row.errorMessage}</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="card shop-category__empty mod-panel__empty">
            <p className="muted">Действий пока не было</p>
          </div>
        )}
      </section>
    </div>
  );
}
