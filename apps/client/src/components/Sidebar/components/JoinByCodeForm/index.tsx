import { useState, type FormEvent } from 'react';
import { joinProject, type JoinRequest } from '../../../../api/joinRequestsApi';
import { ApiError } from '../../../../api/authApi';
import styles from './JoinByCodeForm.module.scss';

interface JoinByCodeFormProps {
  onSuccess: (joinRequest: JoinRequest) => void;
}

export function JoinByCodeForm({ onSuccess }: JoinByCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const joinRequest = await joinProject(code);
      setCode('');
      onSuccess(joinRequest);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      )}
      <div className={styles.row}>
        <input
          className={styles.input}
          placeholder="Код проекта"
          aria-label="Код проекта"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isSubmitting}
          required
        />
        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? '...' : 'Вступить'}
        </button>
      </div>
    </form>
  );
}
