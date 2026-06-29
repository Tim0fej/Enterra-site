import { Link } from 'react-router-dom';
import { JOIN_STEPS, SERVER_CONFIG, SERVER_DAILY_RESTART_SHORT, TELEGRAM_CHANNEL_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export function Join() {
  const { user } = useAuth();
  const cardRef = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="section section--cta" id="join">
      <div className="container">
        <div className="join-card" ref={cardRef}>
          <div className="join-card__content">
            <span className="section__tag">Как зайти</span>
            <h2 className="section__title">Четыре шага до приключения</h2>

            <ol className="steps">
              {JOIN_STEPS.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <span>
                    {'showIp' in step && step.showIp ? (
                      user ? (
                        <>
                          Введи адрес: <code>{SERVER_CONFIG.ip}</code>
                        </>
                      ) : (
                        <>
                          Адрес сервера откроется в{' '}
                          <Link to="/register">профиле</Link> после регистрации
                        </>
                      )
                    ) : 'link' in step && step.link ? (
                      user || step.link !== '/mods' ? (
                        <Link to={step.link}>{step.description} →</Link>
                      ) : (
                        <>
                          {step.description.replace(' на странице «Моды»', '')} —{' '}
                          <Link to="/register">после регистрации</Link>
                        </>
                      )
                    ) : (
                      step.description
                    )}
                  </span>
                </li>
              ))}
            </ol>
            <p className="join-card__restart muted">{SERVER_DAILY_RESTART_SHORT} · обычно 1–3 минуты</p>
          </div>

          <div className="join-card__side">
            <div className="join-side-card">
              <div className="join-side-card__icon">💬</div>
              <h3>Поддержка на сайте</h3>
              <p>Вопросы, жалобы и подтверждение доната — через тикеты.</p>
              <Link to="/tickets" className="btn btn--primary btn--full">
                Открыть тикеты
              </Link>
              <a
                href={TELEGRAM_CHANNEL_URL}
                className="link-btn join-side-card__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram — новости сервера →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
