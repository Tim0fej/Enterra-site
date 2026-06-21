import { Link } from 'react-router-dom';
import { LogoLink } from './Logo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <LogoLink size="sm" />

        <nav className="footer__links" aria-label="Подвал">
          <Link to="/forum">Форум</Link>
          <Link to="/support">Поддержать</Link>
          <Link to="/tickets">Тикеты</Link>
        </nav>

        <p className="footer__copy">© 2026 Enterra</p>
      </div>
    </footer>
  );
}
