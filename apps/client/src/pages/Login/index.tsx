import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/LoginForm';
import { useAuth } from '../../auth/AuthContext';
import styles from './Login.module.scss';

export function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.badge} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.subtitle}>Войдите в аккаунт, чтобы продолжить работу с задачами</p>
        <LoginForm
          onSuccess={(response) => {
            login(response);
            navigate('/dashboard', { replace: true });
          }}
        />
        <p className={styles.switchLine}>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </main>
  );
}
