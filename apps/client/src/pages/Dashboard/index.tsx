import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  listTasks,
  updateTask,
  deleteTask,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '../../api/tasksApi';
import { listMembers, type Member } from '../../api/projectsApi';
import { KanbanBoard } from '../../components/KanbanBoard';
import { TaskForm } from '../../components/TaskForm';
import { TaskFilterBar, type TaskFiltersState } from '../../components/TaskFilterBar';
import styles from './Dashboard.module.scss';

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const filters: TaskFiltersState = {
    status: searchParams.get('status') ?? '',
    priority: searchParams.get('priority') ?? '',
    assigneeId: searchParams.get('assigneeId') ?? '',
    search: searchParams.get('search') ?? '',
  };

  useEffect(() => {
    if (!isAuthenticated || !projectId) {
      return;
    }

    listTasks(projectId, {
      status: (filters.status || undefined) as TaskStatus | undefined,
      priority: (filters.priority || undefined) as TaskPriority | undefined,
      assigneeId: filters.assigneeId || undefined,
      search: filters.search || undefined,
    })
      .then(setTasks)
      .catch(() => setError('Не удалось загрузить задачи проекта.'));

    listMembers(projectId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [
    isAuthenticated,
    projectId,
    filters.status,
    filters.priority,
    filters.assigneeId,
    filters.search,
  ]);

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

  const handleFiltersChange = (next: TaskFiltersState) => {
    const params: Record<string, string> = {};
    if (next.status) params.status = next.status;
    if (next.priority) params.priority = next.priority;
    if (next.assigneeId) params.assigneeId = next.assigneeId;
    if (next.search) params.search = next.search;
    setSearchParams(params);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.newTaskButton} onClick={openCreateForm}>
          + Новая задача
        </button>
      </header>

      <TaskFilterBar filters={filters} members={members} onChange={handleFiltersChange} />

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
