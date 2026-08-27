import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoButton } from './index';
import type { Project } from '../../../../api/projectsApi';

const project: Project = {
  id: 'p1',
  name: 'My Project',
  code: 'AAAAAAAA',
  ownerId: '1',
  createdAt: '2026-01-01',
};

describe('InfoButton', () => {
  test('renders nothing without an open project', () => {
    const { container } = render(<InfoButton project={undefined} currentUserId="1" />);

    expect(container).toBeEmptyDOMElement();
  });

  test('opens a panel with the project name, code, and owner role', async () => {
    const user = userEvent.setup();
    render(<InfoButton project={project} currentUserId="1" />);

    const button = screen.getByRole('button', { name: 'Информация' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);

    expect(screen.getByText('My Project')).toBeInTheDocument();
    expect(screen.getByText('AAAAAAAA')).toBeInTheDocument();
    expect(screen.getByText('Владелец')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('shows member role for a non-owner', async () => {
    const user = userEvent.setup();
    render(<InfoButton project={project} currentUserId="2" />);

    await user.click(screen.getByRole('button', { name: 'Информация' }));

    expect(screen.getByText('Участник')).toBeInTheDocument();
  });
});
