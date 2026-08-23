import { useState, type FormEvent } from 'react';
import { registerUser, ApiError, type RegisterResponse } from '../api/authApi';
import styles from './RegistrationForm.module.css';

interface RegistrationFormProps {
  onSuccess: (response: RegisterResponse) => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await registerUser({ email, password });
      onSuccess(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && (
        <p className={styles.alert} role="alert" aria-live="assertive">
          <svg
            className={styles.alertIcon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {error}
        </p>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className={styles.input}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          autoComplete="email"
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={styles.input}
          placeholder="Минимум 8 символов"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          autoComplete="new-password"
          required
        />
        <span className={styles.hint}>Пароль должен содержать не менее 8 символов</span>
      </div>

      <button className={styles.submit} type="submit" disabled={isSubmitting}>
        {isSubmitting && <span className={styles.spinner} aria-hidden="true" />}
        {isSubmitting ? 'Регистрируемся...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
