import { Link } from 'react-router-dom';
import { JOIN_STEPS, SERVER_CONFIG } from '../config';
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
                      <Link to={step.link}>{step.description} →</Link>
                    ) : (
                      step.description
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="join-card__side">
            <div className="join-side-card">
              <div className="join-side-card__icon">💬</div>
              <h3>Поддержка на сайте</h3>
              <p>Вопросы, жалобы и подтверждение доната — через тикеты. Без Discord.</p>
              <Link to="/tickets" className="btn btn--primary btn--full">
                Открыть тикеты
              </Link>
              <Link to="/support" className="link-btn join-side-card__link">
                Поддержать проект →
              </Link>
              <Link to="/mods" className="link-btn join-side-card__link">
                Моды Fabric 1.21.4 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
