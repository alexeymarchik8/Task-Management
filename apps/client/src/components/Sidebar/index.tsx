import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listProjects, type Project } from '../../api/projectsApi';
import { ProjectList } from './components/ProjectList';
import { ProjectSearch } from './components/ProjectSearch';
import { CreateProjectForm } from './components/CreateProjectForm';
import { JoinByCodeForm } from './components/JoinByCodeForm';
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinMessage, setJoinMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    listProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, [isAuthenticated]);

  const filteredProjects = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [projects, searchQuery],
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside className={styles.sidebar} aria-label="Навигация">
      <section className={styles.section}>
        <h2 className={styles.heading}>Проекты</h2>
        <ProjectSearch value={searchQuery} onChange={setSearchQuery} />
        <ProjectList projects={filteredProjects} />
        <CreateProjectForm onSuccess={(project) => setProjects((prev) => [...prev, project])} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Присоединиться по коду</h2>
        <JoinByCodeForm onSuccess={() => setJoinMessage('Заявка отправлена')} />
        {joinMessage && <p className={styles.joinMessage}>{joinMessage}</p>}
      </section>
    </aside>
  );
}
