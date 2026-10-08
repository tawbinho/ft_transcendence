import { screen } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { IconButton } from './IconButton';

const icon = <svg aria-hidden="true" />;

describe('IconButton', () => {
  it('is a button named by its label', async () => {
    const onClick = vi.fn();
    const { events, container } = renderWithProviders(
      <IconButton label="Open menu" onClick={onClick}>
        {icon}
      </IconButton>,
    );

    await events.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('title', 'Open menu');
    await expectNoA11yViolations(container);
  });

  it('does not submit a form unless told to', () => {
    renderWithProviders(<IconButton label="Close">{icon}</IconButton>);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('type', 'button');
  });

  it('passes other button attributes on, such as aria-expanded', () => {
    renderWithProviders(
      <IconButton label="Menu" aria-expanded={true}>
        {icon}
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('does nothing while disabled', async () => {
    const onClick = vi.fn();
    const { events } = renderWithProviders(
      <IconButton label="Send" disabled onClick={onClick}>
        {icon}
      </IconButton>,
    );
    await events.click(screen.getByRole('button', { name: 'Send' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is a link when given a destination', async () => {
    const { container } = renderWithProviders(
      <IconButton label="Chat" to="/chat">
        {icon}
      </IconButton>,
    );

    expect(screen.getByRole('link', { name: 'Chat' })).toHaveAttribute('href', '/chat');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
