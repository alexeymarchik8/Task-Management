import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { listProjects, type Project } from '../../api/projectsApi';
import {
  listMyJoinRequests,
  listPendingJoinRequests,
  deleteJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  type JoinRequest,
  type PendingJoinRequest,
} from '../../api/joinRequestsApi';
import { ProjectList } from './components/ProjectList';
import { ProjectSearch } from './components/ProjectSearch';
import { CreateProjectForm } from './components/CreateProjectForm';
import { JoinByCodeForm } from './components/JoinByCodeForm';
import { MyJoinRequests } from './components/MyJoinRequests';
import { PendingRequests } from './components/PendingRequests';
import { People } from './components/People';
import { InfoButton } from './components/InfoButton';
import { ProjectSettings } from './components/ProjectSettings';
import { ThemeToggle } from '../ThemeToggle';
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const { isAuthenticated, user } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [myJoinRequests, setMyJoinRequests] = useState<JoinRequest[]>([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState<PendingJoinRequest[]>([]);
  const [membersRefreshKey, setMembersRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    listProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
    listMyJoinRequests()
      .then(setMyJoinRequests)
      .catch(() => setMyJoinRequests([]));
    listPendingJoinRequests()
      .then(setPendingJoinRequests)
      .catch(() => setPendingJoinRequests([]));
  }, [isAuthenticated]);

  const filteredProjects = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [projects, searchQuery],
  );

  const openProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  );

  const hideJoinRequest = (id: string) => {
    deleteJoinRequest(id).then(() => {
      setMyJoinRequests((prev) => prev.filter((r) => r.id !== id));
    });
  };

  const approvePendingRequest = (id: string) => {
    approveJoinRequest(id).then(() => {
      setPendingJoinRequests((prev) => prev.filter((r) => r.id !== id));
      setMembersRefreshKey((key) => key + 1);
    });
  };

  const rejectPendingRequest = (id: string) => {
    rejectJoinRequest(id).then(() => {
      setPendingJoinRequests((prev) => prev.filter((r) => r.id !== id));
    });
  };

  const handleProjectRenamed = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleProjectLeftOrDeleted = () => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    navigate('/homepage');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside className={styles.sidebar} aria-label="Навигация">
      <div className={styles.topBar}>
        <ThemeToggle />
      </div>

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

      <section className={styles.section}>
        <h2 className={styles.heading}>Мои заявки</h2>
        <MyJoinRequests joinRequests={myJoinRequests} onHide={hideJoinRequest} />
      </section>

      {pendingJoinRequests.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.heading}>
            Заявки на вступление
            <span
              className={styles.badge}
              aria-label={`Ожидающих заявок: ${pendingJoinRequests.length}`}
            >
              {pendingJoinRequests.length}
            </span>
          </h2>
          <PendingRequests
            pendingRequests={pendingJoinRequests}
            onApprove={approvePendingRequest}
            onReject={rejectPendingRequest}
          />
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.heading}>Люди</h2>
        <People refreshKey={membersRefreshKey} />
        <InfoButton project={openProject} currentUserId={user?.id ?? ''} />
        <ProjectSettings
          project={openProject}
          currentUserId={user?.id ?? ''}
          onRenamed={handleProjectRenamed}
          onLeftOrDeleted={handleProjectLeftOrDeleted}
          onMembersChanged={() => setMembersRefreshKey((key) => key + 1)}
        />
      </section>
    </aside>
  );
}
