import styles from '../Register.module.scss';

export function RegisterHeader() {
  return (
    <>
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
      <h1 className={styles.title}>Регистрация</h1>
      <p className={styles.subtitle}>Создайте аккаунт, чтобы начать работу с задачами</p>
    </>
  );
}
