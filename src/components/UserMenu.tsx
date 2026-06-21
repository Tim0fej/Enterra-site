import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin, isStaff } from '../utils/roles';

interface UserMenuProps {
  onLogout: () => void;
  onClose?: () => void;
}

export function UserMenu({ onLogout, onClose }: UserMenuProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!user) return null;

  const go = (path: string) => {
    setOpen(false);
    onClose?.();
    navigate(path);
  };

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu__trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {user.username}
        <span className="user-menu__chevron" aria-hidden>▾</span>
      </button>

      {open && (
        <div className="user-menu__dropdown">
          <button type="button" onClick={() => go('/profile')}>Профиль</button>
          {isStaff(user.role) && (
            <button type="button" onClick={() => go('/moder')}>Модерация</button>
          )}
          {isAdmin(user.role) && (
            <button type="button" onClick={() => go('/admin')}>Админ-панель</button>
          )}
          <hr />
          <button type="button" className="user-menu__logout" onClick={() => { setOpen(false); onLogout(); }}>
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
