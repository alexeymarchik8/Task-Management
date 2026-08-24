import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { listTasks, type Task } from '../../api/tasksApi';
import { KanbanBoard } from '../../components/KanbanBoard';
import styles from './Dashboard.module.scss';

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !projectId) {
      return;
    }

    listTasks(projectId)
      .then(setTasks)
      .catch(() => setError('Не удалось загрузить задачи проекта.'));
  }, [isAuthenticated, projectId]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className={styles.page}>
      {error ? <p className={styles.error}>{error}</p> : <KanbanBoard tasks={tasks} />}
    </main>
  );
}
