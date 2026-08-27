import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { listTasks, updateTask, deleteTask, type Task, type TaskStatus } from '../../api/tasksApi';
import { listMembers, type Member } from '../../api/projectsApi';
import { KanbanBoard } from '../../components/KanbanBoard';
import { TaskForm } from '../../components/TaskForm';
import styles from './Dashboard.module.scss';

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated || !projectId) {
      return;
    }

    listTasks(projectId)
      .then(setTasks)
      .catch(() => setError('Не удалось загрузить задачи проекта.'));

    listMembers(projectId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [isAuthenticated, projectId]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const openCreateForm = () => {
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const handleFormSuccess = (task: Task) => {
    setTasks((current) => {
      const exists = current.some((t) => t.id === task.id);
      return exists ? current.map((t) => (t.id === task.id ? task : t)) : [...current, task];
    });
    setIsFormOpen(false);
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status })
      .then((updated) => {
        setTasks((current) => current.map((t) => (t.id === taskId ? updated : t)));
      })
      .catch(() => setError('Не удалось изменить статус задачи.'));
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId)
      .then(() => {
        setTasks((current) => current.filter((t) => t.id !== taskId));
      })
      .catch(() => setError('Не удалось удалить задачу.'));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.newTaskButton} onClick={openCreateForm}>
          + Новая задача
        </button>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <KanbanBoard
        tasks={tasks}
        members={members}
        onStatusChange={handleStatusChange}
        onEdit={openEditForm}
        onDelete={handleDelete}
      />

      {isFormOpen && projectId && (
        <TaskForm
          projectId={projectId}
          task={editingTask}
          onSuccess={handleFormSuccess}
          onCancel={closeForm}
        />
      )}
    </main>
  );
}
