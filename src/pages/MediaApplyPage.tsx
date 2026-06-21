import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { PageShell } from '../components/Layout';
import { MEDIA_REQUIREMENTS } from '../../shared/mediaRequirements';

const PLATFORMS = ['YouTube', 'Twitch', 'TikTok'] as const;

export function MediaApplyPage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>(PLATFORMS[0]);
  const [channelUrl, setChannelUrl] = useState('');
  const [subscribers, setSubscribers] = useState('');
  const [views, setViews] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api<{ ticketId: number }>('/support/media-application', {
        method: 'POST',
        body: JSON.stringify({ platform, channelUrl, subscribers, views, content }),
      });
      navigate(`/tickets/${data.ticketId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Заявка Media"
      subtitle="Для ютуберов, стримеров и контент-мейкеров — рассмотрение через чат поддержки"
      backTo={{ to: '/support', label: 'Поддержка' }}
    >
      <div className="card card--hint" style={{ marginBottom: 16 }}>
        <p>
          Media выдаётся после проверки заявки администрацией. В игре те же права, что у Vip — отличается только префикс.
          Vip оформляется отдельно на странице{' '}
          <Link to="/support">поддержки проекта</Link>.
        </p>
        <h4 className="media-requirements__title">Условия</h4>
        <ul className="support-perks media-requirements">
          {MEDIA_REQUIREMENTS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <form className="form card" onSubmit={(e) => void handleSubmit(e)}>
        {error && <div className="alert alert--error">{error}</div>}

        <label className="field">
          <span>Площадка</span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as (typeof PLATFORMS)[number])}
          >
            {PLATFORMS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Ссылка на канал</span>
          <input
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://..."
            required
          />
        </label>

        <label className="field">
          <span>Подписчики / аудитория</span>
          <input
            value={subscribers}
            onChange={(e) => setSubscribers(e.target.value)}
            placeholder="Минимум 5 000 подписчиков"
            required
          />
        </label>

        <label className="field">
          <span>Просмотры на видео</span>
          <input
            value={views}
            onChange={(e) => setViews(e.target.value)}
            placeholder="Например: 1 500 просмотров в среднем"
            required
          />
        </label>

        <label className="field">
          <span>О чём контент и как планируешь снимать Enterra</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Кратко опиши формат, частоту публикаций и ссылки на примеры работ..."
            required
          />
        </label>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Отправка...' : 'Отправить заявку'}
        </button>
      </form>
    </PageShell>
  );
}
