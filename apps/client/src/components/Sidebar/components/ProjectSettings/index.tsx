import { useEffect, useState, type FormEvent } from 'react';
import {
  listMembers,
  updateProject,
  deleteProject,
  leaveProject,
  removeMember,
  ApiError,
  type Project,
  type Member,
} from '../../../../api/projectsApi';
import { ConfirmDialog } from '../../../ConfirmDialog';
import styles from './ProjectSettings.module.scss';

interface ProjectSettingsProps {
  project: Project | undefined;
  currentUserId: string;
  onRenamed: (project: Project) => void;
  onLeftOrDeleted: () => void;
  onMembersChanged: () => void;
}

type ConfirmAction =
  { type: 'delete' } | { type: 'leave' } | { type: 'remove'; userId: string; email: string };

export function ProjectSettings({
  project,
  currentUserId,
  onRenamed,
  onLeftOrDeleted,
  onMembersChanged,
}: ProjectSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(project?.name ?? '');
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const isOwner = project?.ownerId === currentUserId;

  useEffect(() => {
    setName(project?.name ?? '');
  }, [project]);

  useEffect(() => {
    if (!project || !isOwner || !isOpen) {
      return;
    }

    listMembers(project.id)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [project, isOwner, isOpen]);

  if (!project) {
    return null;
  }

  const handleRename = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const updated = await updateProject(project.id, { name });
      onRenamed(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так. Попробуйте снова.');
    }
  };

  const handleDelete = async () => {
    setConfirmAction(null);
    try {
      await deleteProject(project.id);
      onLeftOrDeleted();
    } catch {
      setError('Не удалось удалить проект.');
    }
  };

  const handleLeave = async () => {
    setConfirmAction(null);
    try {
      await leaveProject(project.id);
      onLeftOrDeleted();
    } catch {
      setError('Не удалось покинуть проект.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setConfirmAction(null);
    try {
      await removeMember(project.id, userId);
      setMembers((current) => current.filter((m) => m.userId !== userId));
      onMembersChanged();
    } catch {
      setError('Не удалось удалить участника.');
    }
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.button}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Настройки
      </button>

      {isOpen && (
        <div className={styles.panel}>
          {error && (
            <p className={styles.alert} role="alert">
              {error}
            </p>
          )}

          {isOwner && (
            <form className={styles.renameForm} onSubmit={handleRename}>
              <label className={styles.label} htmlFor="project-name">
                Новое название проекта
              </label>
              <input
                id="project-name"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button type="submit" className={styles.saveButton}>
                Сохранить
              </button>
            </form>
          )}

          {isOwner && members.length > 0 && (
            <ul className={styles.memberList}>
              {members
                .filter((member) => member.userId !== currentUserId)
                .map((member) => (
                  <li key={member.userId} className={styles.memberItem}>
                    <span className={styles.memberEmail}>{member.email}</span>
                    <button
                      type="button"
                      className={styles.removeButton}
                      aria-label={`Удалить участника ${member.email}`}
                      onClick={() =>
                        setConfirmAction({
                          type: 'remove',
                          userId: member.userId,
                          email: member.email,
                        })
                      }
                    >
                      Удалить
                    </button>
                  </li>
                ))}
            </ul>
          )}

          {isOwner ? (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => setConfirmAction({ type: 'delete' })}
            >
              Удалить проект
            </button>
          ) : (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => setConfirmAction({ type: 'leave' })}
            >
              Выйти из проекта
            </button>
          )}
        </div>
      )}

      {confirmAction?.type === 'delete' && (
        <ConfirmDialog
          message="Удалить проект без возможности восстановления?"
          confirmLabel="Удалить"
          onConfirm={handleDelete}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === 'leave' && (
        <ConfirmDialog
          message="Покинуть проект?"
          confirmLabel="Выйти"
          onConfirm={handleLeave}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === 'remove' && (
        <ConfirmDialog
          message={`Удалить участника ${confirmAction.email} из проекта?`}
          confirmLabel="Удалить"
          onConfirm={() => handleRemoveMember(confirmAction.userId)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
