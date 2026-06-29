import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { PageShell, useLayoutError } from '../components/Layout';
import { formatApiError } from '../utils/formatError';
import { VIP_MONTHLY_PRICE_RUB } from '../../shared/vipPlans';
import { MediaRequirementsBlock } from '../components/MediaRequirementsBlock';
import {
  getMediaFormLabels,
  MEDIA_PLATFORMS,
  type MediaPlatformName,
} from '../../shared/mediaRequirements';

const PLATFORM_BY_SLUG: Record<string, MediaPlatformName> = {
  youtube: 'YouTube',
  twitch: 'Twitch',
  tiktok: 'TikTok',
};

function resolveInitialPlatform(search: URLSearchParams): MediaPlatformName {
  const raw = search.get('platform')?.toLowerCase();
  if (raw && raw in PLATFORM_BY_SLUG) return PLATFORM_BY_SLUG[raw];
  return MEDIA_PLATFORMS[0];
}

export function MediaApplyPage() {
  const navigate = useNavigate();
  const { showError } = useLayoutError();
  const [searchParams] = useSearchParams();
  const [platform, setPlatform] = useState<MediaPlatformName>(() =>
    resolveInitialPlatform(searchParams),
  );
  const [channelUrl, setChannelUrl] = useState('');
  const [subscribers, setSubscribers] = useState('');
  const [views, setViews] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const formLabels = getMediaFormLabels(platform);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api<{ ticketId: number }>('/support/media-application', {
        method: 'POST',
        body: JSON.stringify({ platform, channelUrl, subscribers, views, content }),
      });
      navigate(`/tickets/${data.ticketId}`);
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Заявка Media"
      subtitle="Для ютуберов, стримеров и контент-мейкеров — рассмотрение через чат поддержки"
      backTo={{ to: '/media', label: 'Медиа' }}
    >
      <div className="card card--hint" style={{ marginBottom: 16 }}>
        <p>
          Media выдаётся после проверки заявки администрацией. В игре права на уровне VIP — отличаются
          бейдж, группа и префикс. VIP —{' '}
          <Link to="/shop">{VIP_MONTHLY_PRICE_RUB} ₽/мес</Link> в магазине.
        </p>
        <MediaRequirementsBlock platform={platform} variant="full" />
      </div>

      <form className="form card" onSubmit={(e) => void handleSubmit(e)}>
        <label className="field">
          <span>Площадка</span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as MediaPlatformName)}
          >
            {MEDIA_PLATFORMS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Ссылка на канал</span>
          <input
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder={
              platform === 'Twitch'
                ? 'https://twitch.tv/ник'
                : platform === 'TikTok'
                  ? 'https://tiktok.com/@ник'
                  : 'https://youtube.com/@канал'
            }
            required
          />
        </label>

        <label className="field">
          <span>{formLabels.audience}</span>
          <input
            value={subscribers}
            onChange={(e) => setSubscribers(e.target.value)}
            placeholder={formLabels.audiencePlaceholder}
            required
          />
        </label>

        <label className="field">
          <span>{formLabels.metric}</span>
          <input
            value={views}
            onChange={(e) => setViews(e.target.value)}
            placeholder={formLabels.metricPlaceholder}
            required
          />
          <small>{formLabels.metricHint}</small>
        </label>

        <label className="field">
          <span>О чём контент и как планируешь снимать Enterra</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder={
              platform === 'Twitch'
                ? 'Формат стримов, частота эфиров, ссылки на клипы или VOD с Enterra...'
                : 'Кратко опиши формат, частоту публикаций и ссылки на примеры работ...'
            }
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
