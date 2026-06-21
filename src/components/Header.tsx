import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../config';
import { useAuth } from '../context/AuthContext';
import { LogoLink } from './Logo';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  onToast?: (msg: string) => void;
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav__link nav__link--active' : 'nav__link';
}

export function Header({ onToast }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    onToast?.('Вы вышли');
  };

  return (
    <header className="header">
      <nav className="nav container">
        <LogoLink size="sm" onClick={closeMenu} />

        <div className={`nav__panel${menuOpen ? ' open' : ''}`}>
          <ul className="nav__links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <NavLink to={link.href} className={navClass} onClick={closeMenu}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav__actions">
            {user ? (
              <UserMenu onLogout={handleLogout} onClose={closeMenu} />
            ) : (
              <>
                <NavLink to="/login" className={navClass} onClick={closeMenu}>
                  Вход
                </NavLink>
                <Link to="/register" className="btn btn--primary btn--nav" onClick={closeMenu}>
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`nav__burger${menuOpen ? ' open' : ''}`}
          aria-label="Меню"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
    </header>
  );
}
