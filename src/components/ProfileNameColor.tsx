import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  NAME_COLOR_PRESETS,
  extractHexFromNameColor,
  hasVipNameColorAccess,
  isCustomHexNameColor,
  nameColorPreviewStyle,
  nameColorToCss,
  normalizeRgbHexInput,
} from '../../shared/nameColor';
import type { User } from '../types/auth';
import { useLayoutToast } from './Layout';
import { formatApiError } from '../utils/formatError';

interface ProfileNameColorProps {
  user: User;
  onUpdated: (user: User) => void;
}

export function ProfileNameColorUpsell({ user }: { user: User }) {
  if (user.nameColorAllowed) {
    return null;
  }

  return (
    <div className="card profile-name-color profile-name-color--locked">
      <h3>Цвет ника</h3>
      <p className="muted profile-name-color__desc">
        VIP-привилегия: выбери цвет ника на сайте — на сервере применится в чате и табе.
      </p>
      <Link to="/shop" className="btn btn--primary">
        Купить VIP в магазине
      </Link>
    </div>
  );
}

export function ProfileNameColor({ user, onUpdated }: ProfileNameColorProps) {
  const { showToast, showError } = useLayoutToast();
  const [selected, setSelected] = useState(user.nameColor ?? '');
  const [rgbHex, setRgbHex] = useState(() => extractHexFromNameColor(user.nameColor));
  const [rgbInput, setRgbInput] = useState(() => extractHexFromNameColor(user.nameColor));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(user.nameColor ?? '');
    const hex = extractHexFromNameColor(user.nameColor);
    setRgbHex(hex);
    setRgbInput(hex);
  }, [user.nameColor]);

  const previewStyle = useMemo(() => nameColorPreviewStyle(selected), [selected]);
  const isVip = hasVipNameColorAccess(user.privilege?.slug);
  const isCustomRgb = isCustomHexNameColor(selected);

  if (!user.nameColorAllowed) {
    return null;
  }

  const save = async (value: string | null) => {
    setSaving(true);
    try {
      const data = await api<User & { message?: string }>('/auth/name-color', {
        method: 'PATCH',
        body: JSON.stringify({ nameColor: value }),
      });
      onUpdated(data);
      setSelected(data.nameColor ?? '');
      const hex = extractHexFromNameColor(data.nameColor);
      setRgbHex(hex);
      setRgbInput(hex);
      showToast(
        data.message ??
          'Цвет сохранён. На сервере: зайди в игру или введи /privsync',
      );
    } catch (err) {
      showError(formatApiError(err, 'Не удалось сохранить цвет'));
    } finally {
      setSaving(false);
    }
  };

  const applyRgb = (raw: string) => {
    const normalized = normalizeRgbHexInput(raw);
    if (!normalized) {
      showError('Введи цвет в формате #RRGGBB');
      return;
    }
    setRgbHex(normalized);
    setRgbInput(normalized);
    setSelected(normalized);
    void save(normalized);
  };

  return (
    <div className="card profile-name-color">
      <div className="profile-name-color__head">
        <h3>Цвет ника</h3>
        {isVip ? <span className="profile-name-color__vip-badge">VIP</span> : null}
      </div>
      <p className="muted profile-name-color__desc">
        Палитра или свой RGB-цвет. На сервере — чат и таб; если ты уже в игре, введи{' '}
        <code>/privsync</code> после сохранения.
      </p>

      <div className="profile-name-color__preview" aria-live="polite">
        <span className="profile-name-color__preview-label">Превью</span>
        <strong className="profile-name-color__preview-name" style={previewStyle}>
          {user.username}
        </strong>
      </div>

      <div
        className={`profile-name-color__rgb${isCustomRgb ? ' profile-name-color__rgb--active' : ''}`}
      >
        <div className="profile-name-color__rgb-head">
          <span className="profile-name-color__rgb-label">Свой RGB</span>
          <span className="profile-name-color__rgb-hint">любой оттенок для VIP и медиа</span>
        </div>
        <div className="profile-name-color__rgb-controls">
          <label className="profile-name-color__rgb-picker-wrap">
            <input
              type="color"
              className="profile-name-color__rgb-picker"
              value={rgbHex}
              disabled={saving}
              aria-label="Выбор RGB-цвета"
              onChange={(event) => applyRgb(event.target.value)}
            />
          </label>
          <input
            type="text"
            className="profile-name-color__rgb-input"
            value={rgbInput}
            disabled={saving}
            spellCheck={false}
            autoComplete="off"
            placeholder="#FFAA00"
            aria-label="Hex-код цвета"
            onChange={(event) => setRgbInput(event.target.value.toUpperCase())}
            onBlur={() => {
              if (rgbInput.trim() === rgbHex) {
                return;
              }
              applyRgb(rgbInput);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyRgb(rgbInput);
              }
            }}
          />
          <button
            type="button"
            className="btn btn--ghost profile-name-color__rgb-apply"
            disabled={saving}
            onClick={() => applyRgb(rgbInput)}
          >
            Применить
          </button>
        </div>
      </div>

      <p className="profile-name-color__presets-title">Быстрая палитра</p>
      <div className="profile-name-color__presets" role="listbox" aria-label="Палитра цветов">
        {NAME_COLOR_PRESETS.map((preset) => {
          const css = nameColorToCss(preset.value);
          const active = selected === preset.value;
          return (
            <button
              key={preset.id}
              type="button"
              role="option"
              aria-selected={active}
              className={`profile-name-color__swatch${active ? ' profile-name-color__swatch--active' : ''}`}
              disabled={saving}
              title={preset.label}
              onClick={() => {
                setSelected(preset.value);
                void save(preset.value);
              }}
            >
              <span
                className="profile-name-color__swatch-dot"
                style={css ? { backgroundColor: css } : undefined}
                aria-hidden="true"
              />
              <span className="profile-name-color__swatch-label">{preset.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn--ghost profile-name-color__reset"
        disabled={saving || !selected}
        onClick={() => void save(null)}
      >
        Сбросить цвет
      </button>
    </div>
  );
}
