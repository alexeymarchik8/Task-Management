import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getAnalyticsSummary, type AnalyticsSummary } from '../../api/analyticsApi';
import styles from './Home.module.scss';

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    getAnalyticsSummary()
      .then(setSummary)
      .catch(() => setError('Не удалось загрузить сводку по задачам.'));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Обзор</h1>

      {error && <p className={styles.error}>{error}</p>}

      {summary && (
        <>
          <section className={styles.summary}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Всего задач</span>
              <span className={styles.summaryValue}>{summary.totalTasks}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Выполнено</span>
              <span className={styles.summaryValue}>{summary.percentDone}%</span>
            </div>
            {Object.entries(summary.byStatus).map(([status, count]) => (
              <div key={status} className={styles.summaryCard} aria-label={STATUS_LABELS[status]}>
                <span className={styles.summaryLabel}>{STATUS_LABELS[status]}</span>
                <span className={styles.summaryValue}>{count}</span>
              </div>
            ))}
          </section>

          <section className={styles.projects}>
            <h2 className={styles.projectsTitle}>Проекты</h2>
            {summary.projects.length === 0 ? (
              <p className={styles.emptyState}>У вас пока нет проектов с задачами.</p>
            ) : (
              <ul className={styles.projectList}>
                {summary.projects.map((project) => (
                  <li key={project.projectId}>
                    <button
                      type="button"
                      className={styles.projectRow}
                      onClick={() => navigate(`/dashboard/${project.projectId}`)}
                    >
                      <span className={styles.projectName}>{project.name}</span>
                      <span className={styles.projectStats}>
                        {project.totalTasks} задач · {project.percentDone}%
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
