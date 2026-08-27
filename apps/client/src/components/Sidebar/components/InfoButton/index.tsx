import { useState } from 'react';
import type { Project } from '../../../../api/projectsApi';
import styles from './InfoButton.module.scss';

interface InfoButtonProps {
  project: Project | undefined;
  currentUserId: string;
}

export function InfoButton({ project, currentUserId }: InfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!project) {
    return null;
  }

  const role = project.ownerId === currentUserId ? 'Владелец' : 'Участник';

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Информация
      </button>
      {isOpen && (
        <div className={styles.panel}>
          <p className={styles.name}>{project.name}</p>
          <p className={styles.row}>
            <span className={styles.label}>Код:</span> {project.code}
          </p>
          <p className={styles.row}>
            <span className={styles.label}>Роль:</span> {role}
          </p>
        </div>
      )}
    </div>
  );
}
