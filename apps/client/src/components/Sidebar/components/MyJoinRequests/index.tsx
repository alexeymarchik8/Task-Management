import type { JoinRequest, JoinRequestStatus } from '../../../../api/joinRequestsApi';
import styles from './MyJoinRequests.module.scss';

interface MyJoinRequestsProps {
  joinRequests: JoinRequest[];
  onHide: (id: string) => void;
}

const STATUS_LABELS: Record<JoinRequestStatus, string> = {
  pending: 'Ожидает',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

export function MyJoinRequests({ joinRequests, onHide }: MyJoinRequestsProps) {
  if (joinRequests.length === 0) {
    return <p className={styles.empty}>У вас нет заявок</p>;
  }

  return (
    <ul className={styles.list}>
      {joinRequests.map((joinRequest) => (
        <li key={joinRequest.id} className={styles.item}>
          <span className={styles.status}>{STATUS_LABELS[joinRequest.status]}</span>
          {joinRequest.status === 'rejected' && (
            <button
              className={styles.hideButton}
              type="button"
              onClick={() => onHide(joinRequest.id)}
            >
              Скрыть
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
