import { Link } from 'react-router-dom';
import { TELEGRAM_CHANNEL_URL } from '../config';

export function Footer() {

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-section">
            <h3>О нас</h3>
            <p>
              Enterra — ванильный Minecraft-сервер с модами для комфортной игры, где мир строят игроки.
            </p>
          </div>

          <div className="footer-section">
            <h3>Ссылки</h3>
            <p>
              <Link to="/">Главная</Link>
            </p>
            <p>
              <Link to="/shop">Магазин</Link>
            </p>
            <p>
              <Link to="/media">Медиа</Link>
            </p>
            <p>
              <Link to="/rules">Правила</Link>
            </p>
            <p>
              <Link to="/faq">FAQ</Link>
            </p>
            <p>
              <Link to="/forum">Форум</Link>
            </p>
          </div>

          <div className="footer-section">
            <h3>Контакты</h3>
            <p>
              <Link to="/tickets">Тикеты поддержки</Link>
            </p>
            <p>
              <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                Telegram-канал
              </a>
            </p>
            <p>
              <Link to="/terms">Пользовательское соглашение</Link>
            </p>
            <p>
              <Link to="/refund">Возврат средств</Link>
            </p>
          </div>

          <div className="footer-section">
            <h3>Социальные сети</h3>
            <p>
              <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Enterra. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
