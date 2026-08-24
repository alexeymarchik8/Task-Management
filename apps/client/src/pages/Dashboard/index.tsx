import styles from './Dashboard.module.scss';

export function Dashboard() {
  return (
    <main className={styles.page}>
      <div>
        <h1 className={styles.title}>Task Management</h1>
        <p className={styles.subtitle}>React client is running.</p>
      </div>
    </main>
  );
}
