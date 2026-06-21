import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { PageShell } from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(loginValue, password);
      navigate('/profile');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Вход"
      subtitle="Войди в аккаунт Enterra"
      backTo={{ to: '/', label: 'Главная' }}
    >
      <form className="form card" onSubmit={(e) => void handleSubmit(e)}>
        {error && <div className="alert alert--error">{error}</div>}

        <label className="field">
          <span>Ник или Email</span>
          <input
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            placeholder="Steve или you@email.com"
            required
          />
        </label>

        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>

        <p className="form-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </PageShell>
  );
}
