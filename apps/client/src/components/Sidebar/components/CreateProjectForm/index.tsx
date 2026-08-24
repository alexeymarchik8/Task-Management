import { useState, type FormEvent } from 'react';
import { createProject, ApiError, type Project } from '../../../../api/projectsApi';
import styles from './CreateProjectForm.module.scss';

interface CreateProjectFormProps {
  onSuccess: (project: Project) => void;
}

export function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const project = await createProject({ name });
      setName('');
      onSuccess(project);
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
          placeholder="Название проекта"
          aria-label="Название проекта"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          required
        />
        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? '...' : 'Создать'}
        </button>
      </div>
    </form>
  );
}
