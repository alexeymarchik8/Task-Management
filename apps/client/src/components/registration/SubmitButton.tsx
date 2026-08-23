import styles from '../RegistrationForm.module.scss';

interface SubmitButtonProps {
  isSubmitting: boolean;
}

export function SubmitButton({ isSubmitting }: SubmitButtonProps) {
  return (
    <button className={styles.submit} type="submit" disabled={isSubmitting}>
      {isSubmitting && <span className={styles.spinner} aria-hidden="true" />}
      {isSubmitting ? 'Регистрируемся...' : 'Зарегистрироваться'}
    </button>
  );
}
