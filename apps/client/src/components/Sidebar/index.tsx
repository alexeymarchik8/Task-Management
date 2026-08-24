import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { listProjects, type Project } from '../../api/projectsApi';
import { ProjectList } from './components/ProjectList';
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    listProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside className={styles.sidebar} aria-label="Навигация">
      <section className={styles.section}>
        <h2 className={styles.heading}>Проекты</h2>
        <ProjectList projects={projects} />
      </section>
    </aside>
  );
}
