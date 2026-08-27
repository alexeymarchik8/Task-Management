import { useEffect, useState, type FormEvent } from 'react';
import { createTask, updateTask, ApiError, type Task, type TaskPriority } from '../../api/tasksApi';
import { listMembers, type Member } from '../../api/projectsApi';
import styles from './TaskForm.module.scss';

interface TaskFormProps {
  projectId: string;
  task?: Task;
  onSuccess: (task: Task) => void;
  onCancel: () => void;
}

export function TaskForm({ projectId, task, onSuccess, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '');
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listMembers(projectId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [projectId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const data = {
      title,
      description: description || undefined,
      priority,
      dueDate: dueDate || undefined,
      assigneeId: assigneeId || undefined,
    };

    try {
      const result = task ? await updateTask(task.id, data) : await createTask(projectId, data);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.heading}>{task ? 'Редактировать задачу' : 'Новая задача'}</h2>

        {error && (
          <p className={styles.alert} role="alert">
            {error}
          </p>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="task-title">
            Заголовок
          </label>
          <input
            id="task-title"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="task-description">
            Описание
          </label>
          <textarea
            id="task-description"
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="task-priority">
              Приоритет
            </label>
            <select
              id="task-priority"
              className={styles.select}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              disabled={isSubmitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="task-due-date">
              Срок
            </label>
            <input
              id="task-due-date"
              type="date"
              className={styles.input}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="task-assignee">
            Исполнитель
          </label>
          <select
            id="task-assignee"
            className={styles.select}
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Не назначен</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.email}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}
