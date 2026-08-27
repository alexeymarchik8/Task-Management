import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PendingRequests } from './index';
import type { PendingJoinRequest } from '../../../../api/joinRequestsApi';

const requests: PendingJoinRequest[] = [
  {
    id: '1',
    userId: 'u1',
    projectId: 'p1',
    status: 'pending',
    user: { id: 'u1', email: 'applicant@example.com' },
  },
];

describe('PendingRequests', () => {
  test('renders the applicant email for each pending request', () => {
    render(<PendingRequests pendingRequests={requests} onApprove={vi.fn()} onReject={vi.fn()} />);

    expect(screen.getByText('applicant@example.com')).toBeInTheDocument();
  });

  test('calls onApprove with the request id', async () => {
    const onApprove = vi.fn();
    const user = userEvent.setup();

    render(<PendingRequests pendingRequests={requests} onApprove={onApprove} onReject={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Принять' }));

    expect(onApprove).toHaveBeenCalledWith('1');
  });

  test('calls onReject with the request id', async () => {
    const onReject = vi.fn();
    const user = userEvent.setup();

    render(<PendingRequests pendingRequests={requests} onApprove={vi.fn()} onReject={onReject} />);
    await user.click(screen.getByRole('button', { name: 'Отклонить' }));

    expect(onReject).toHaveBeenCalledWith('1');
  });
});
