import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listMembers, type Member } from '../../../../api/projectsApi';
import styles from './People.module.scss';

const ROLE_LABELS: Record<Member['role'], string> = {
  owner: 'Владелец',
  member: 'Участник',
};

interface PeopleProps {
  refreshKey?: number;
}

export function People({ refreshKey }: PeopleProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!projectId) {
      setMembers([]);
      return;
    }

    listMembers(projectId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [projectId, refreshKey]);

  if (!projectId) {
    return <p className={styles.empty}>Проект не открыт</p>;
  }

  return (
    <ul className={styles.list}>
      {members.map((member) => (
        <li key={member.userId} className={styles.item}>
          <span className={styles.email}>{member.email}</span>
          <span className={styles.role}>{ROLE_LABELS[member.role]}</span>
        </li>
      ))}
    </ul>
  );
}
