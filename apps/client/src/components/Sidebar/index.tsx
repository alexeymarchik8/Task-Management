import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const { isAuthenticated, user } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [myJoinRequests, setMyJoinRequests] = useState<JoinRequest[]>([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState<PendingJoinRequest[]>([]);

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
    });
  };

  const rejectPendingRequest = (id: string) => {
    rejectJoinRequest(id).then(() => {
      setPendingJoinRequests((prev) => prev.filter((r) => r.id !== id));
    });
  };

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
        <People />
        <InfoButton project={openProject} currentUserId={user?.id ?? ''} />
      </section>
    </aside>
  );
}
