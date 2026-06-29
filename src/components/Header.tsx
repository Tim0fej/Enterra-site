import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { navLinksForUser } from '../config';
import { useAuth } from '../context/AuthContext';
import { LogoLink } from './Logo';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  onToast?: (msg: string) => void;
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav__link nav__link--active' : 'nav__link';
}

function NavPanel({
  user,
  onClose,
  onLogout,
  className,
}: {
  user: ReturnType<typeof useAuth>['user'];
  onClose: () => void;
  onLogout: () => void;
  className?: string;
}) {
  const links = navLinksForUser(Boolean(user));

  return (
    <div className={className}>
      <ul className="nav__links">
        {links.map((link) => (
          <li key={link.href}>
            <NavLink to={link.href} className={navClass} onClick={onClose}>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="nav__actions">
        {user ? (
          <UserMenu onLogout={onLogout} onClose={onClose} />
        ) : (
          <>
            <NavLink to="/login" className={navClass} onClick={onClose}>
              Вход
            </NavLink>
            <Link to="/register" className="btn btn--primary btn--nav" onClick={onClose}>
              Регистрация
            </Link>
          </>
        )}
      </div>
    </div>
  );
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

  useEffect(() => {
    if (!menuOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const mobileMenu =
    menuOpen &&
    createPortal(
      <>
        <button
          type="button"
          className="nav__backdrop"
          aria-label="Закрыть меню"
          onClick={closeMenu}
        />
        <div className="nav__drawer" role="dialog" aria-modal="true" aria-label="Меню">
          <NavPanel
            user={user}
            onClose={closeMenu}
            onLogout={handleLogout}
            className="nav__drawer-inner"
          />
        </div>
      </>,
      document.body,
    );

  return (
    <>
      <header className={`header${menuOpen ? ' header--menu-open' : ''}`}>
        <nav className="nav container">
          <LogoLink size="sm" onClick={closeMenu} />

          <NavPanel
            user={user}
            onClose={closeMenu}
            onLogout={handleLogout}
            className="nav__panel nav__panel--desktop"
          />

          <button
            type="button"
            className={`nav__burger${menuOpen ? ' open' : ''}`}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </header>
      {mobileMenu}
    </>
  );
}
