import { screen } from '@testing-library/react';
import { useState } from 'react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { Switch } from './Switch';

function Example({ disabled = false }: { disabled?: boolean }) {
  const [on, setOn] = useState(false);
  return <Switch label="Show animations" checked={on} disabled={disabled} onChange={(e) => setOn(e.target.checked)} />;
}

describe('Switch', () => {
  it('is a switch with a label', async () => {
    const { container } = renderWithProviders(<Example />);

    expect(screen.getByRole('switch', { name: 'Show animations' })).not.toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('turns on and off when clicked, also through its label text', async () => {
    const { events } = renderWithProviders(<Example />);
    const toggle = screen.getByRole('switch', { name: 'Show animations' });

    await events.click(toggle);
    expect(toggle).toBeChecked();

    await events.click(screen.getByText('Show animations'));
    expect(toggle).not.toBeChecked();
  });

  it('turns on with the space bar', async () => {
    const { events } = renderWithProviders(<Example />);

    await events.tab();
    await events.keyboard(' ');

    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('cannot be changed while disabled', async () => {
    const { events } = renderWithProviders(<Example disabled />);

    await events.click(screen.getByRole('switch'));

    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.getByRole('switch')).not.toBeChecked();
  });
});
