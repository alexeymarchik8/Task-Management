import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyJoinRequests } from './index';
import type { JoinRequest } from '../../../../api/joinRequestsApi';

describe('MyJoinRequests', () => {
  test('shows an empty message when there are no requests', () => {
    render(<MyJoinRequests joinRequests={[]} onHide={vi.fn()} />);

    expect(screen.getByText('У вас нет заявок')).toBeInTheDocument();
  });

  test('renders the status label for each request', () => {
    const requests: JoinRequest[] = [
      { id: '1', userId: 'u1', projectId: 'p1', status: 'pending' },
      { id: '2', userId: 'u1', projectId: 'p2', status: 'approved' },
    ];

    render(<MyJoinRequests joinRequests={requests} onHide={vi.fn()} />);

    expect(screen.getByText('Ожидает')).toBeInTheDocument();
    expect(screen.getByText('Одобрена')).toBeInTheDocument();
  });

  test('shows a hide button only for rejected requests, and calls onHide with its id', async () => {
    const onHide = vi.fn();
    const requests: JoinRequest[] = [
      { id: '1', userId: 'u1', projectId: 'p1', status: 'pending' },
      { id: '2', userId: 'u1', projectId: 'p2', status: 'rejected' },
    ];
    const user = userEvent.setup();

    render(<MyJoinRequests joinRequests={requests} onHide={onHide} />);

    const hideButtons = screen.getAllByRole('button', { name: 'Скрыть' });
    expect(hideButtons).toHaveLength(1);

    await user.click(hideButtons[0]);
    expect(onHide).toHaveBeenCalledWith('2');
  });
});
