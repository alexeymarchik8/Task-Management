import { Link, Navigate, useNavigate } from 'react-router-dom';
import { RegistrationForm } from '../components/RegistrationForm';
import { useAuth } from '../auth/AuthContext';
import { RegisterHeader } from './register/RegisterHeader';
import styles from './Register.module.scss';

export function Register() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <RegisterHeader />
        <RegistrationForm
          onSuccess={(response) => {
            login(response);
            navigate('/dashboard', { replace: true });
          }}
        />
        <p className={styles.switchLine}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </main>
  );
}
