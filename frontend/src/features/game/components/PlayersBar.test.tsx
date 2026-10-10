import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { PlayersBar } from './PlayersBar';

describe('PlayersBar', () => {
  it('shows both names with the color of their disc', () => {
    renderWithProviders(<PlayersBar theme="ocean" names={['alice', 'bob']} activeSeat={null} />);

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('Coral')).toBeInTheDocument();
    expect(screen.getByText('Pearl')).toBeInTheDocument();
  });

  it('highlights only the player whose turn it is', () => {
    const { container, rerender } = renderWithProviders(
      <PlayersBar theme="classic" names={['alice', 'bob']} activeSeat={2} />,
    );
    const highlighted = () => [...container.querySelectorAll('.border-primary')].map((tag) => tag.textContent);

    expect(highlighted()).toEqual([expect.stringContaining('bob')]);

    rerender(<PlayersBar theme="classic" names={['alice', 'bob']} activeSeat={null} />);
    expect(highlighted()).toEqual([]);
  });
});
