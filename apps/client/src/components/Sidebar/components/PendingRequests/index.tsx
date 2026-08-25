import type { PendingJoinRequest } from '../../../../api/joinRequestsApi';
import styles from './PendingRequests.module.scss';

interface PendingRequestsProps {
  pendingRequests: PendingJoinRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function PendingRequests({ pendingRequests, onApprove, onReject }: PendingRequestsProps) {
  return (
    <ul className={styles.list}>
      {pendingRequests.map((request) => (
        <li key={request.id} className={styles.item}>
          <span className={styles.email}>{request.user.email}</span>
          <div className={styles.actions}>
            <button
              className={styles.approveButton}
              type="button"
              onClick={() => onApprove(request.id)}
            >
              Принять
            </button>
            <button
              className={styles.rejectButton}
              type="button"
              onClick={() => onReject(request.id)}
            >
              Отклонить
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
