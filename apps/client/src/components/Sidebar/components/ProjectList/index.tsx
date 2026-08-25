import { Link } from 'react-router-dom';
import type { Project } from '../../../../api/projectsApi';
import styles from './ProjectList.module.scss';

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className={styles.empty}>У вас пока нет проектов</p>;
  }

  return (
    <ul className={styles.list}>
      {projects.map((project) => (
        <li key={project.id}>
          <Link className={styles.item} to={`/dashboard/${project.id}`}>
            {project.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
