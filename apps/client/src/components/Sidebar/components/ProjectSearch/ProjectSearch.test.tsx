import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectSearch } from './index';

describe('ProjectSearch', () => {
  test('renders the current value', () => {
    render(<ProjectSearch value="mobile" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Поиск проектов')).toHaveValue('mobile');
  });

  test('calls onChange as the user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ProjectSearch value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('Поиск проектов'), 'a');

    expect(onChange).toHaveBeenCalledWith('a');
  });
});
