import { screen } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';
import { ModeCard } from './ModeCard';

const icon = <svg aria-hidden="true" />;

describe('ModeCard', () => {
  it('with a destination, the whole card is one link with a level 3 heading', async () => {
    const { container } = renderWithProviders(
      <ModeCard to="/play/local" icon={icon} title="Same screen" body="Two players, one device." />,
    );

    const link = screen.getByRole('link', { name: /Same screen/ });
    expect(link).toHaveAttribute('href', '/play/local');
    expect(link).toHaveTextContent('Two players, one device.');
    expect(screen.getByRole('heading', { level: 3, name: 'Same screen' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('with children, shows them below the text under a level 2 heading', async () => {
    const { container } = renderWithProviders(
      <ModeCard icon={icon} title="Online" body="Play a friend.">
        <button type="button">Create a match</button>
      </ModeCard>,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Online' })).toBeInTheDocument();
    expect(screen.getByText('Play a friend.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a match' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('can use another heading level', () => {
    renderWithProviders(<ModeCard icon={icon} title="Computer" body="Practice." headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Computer' })).toBeInTheDocument();
  });
});
