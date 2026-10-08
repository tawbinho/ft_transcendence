import { render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { expectNoA11yViolations } from '@/test/axe';
import i18n from '@/i18n';
import { createBracket, recordWinner } from '../bracket';
import { BracketView, type BracketPairingView } from './BracketView';

function viewOf(bracket: ReturnType<typeof createBracket<string>>, current?: [number, number]) {
  return bracket.map((pairings, round) =>
    pairings.map((pairing, index): BracketPairingView => ({
      key: `${round}:${index}`,
      players: [
        pairing.players[0] === null ? null : { name: pairing.players[0] },
        pairing.players[1] === null ? null : { name: pairing.players[1] },
      ],
      winner: pairing.winner,
      bye: pairing.bye,
      current: current?.[0] === round && current[1] === index,
    })),
  );
}

function renderBracket(props: Partial<React.ComponentProps<typeof BracketView>> & { rounds: BracketPairingView[][] }) {
  void i18n.changeLanguage('en');
  return render(
    <I18nextProvider i18n={i18n}>
      <BracketView label="Bracket" {...props} />
    </I18nextProvider>,
  );
}

describe('BracketView', () => {
  it('names the rounds from the final backwards', () => {
    const eight = createBracket(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    renderBracket({ rounds: viewOf(eight) });

    const headings = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(['Quarter-finals', 'Semi-finals', 'Final']);
  });

  it('shows "Bye" for a player who goes straight through and "To be decided" for a place still empty', () => {
    renderBracket({ rounds: viewOf(createBracket(['Ana', 'Ben', 'Cleo'])) });

    expect(screen.getByText('Bye')).toBeInTheDocument();
    expect(screen.getAllByText('To be decided').length).toBeGreaterThan(0);
  });

  it('marks the winner of a pairing and crosses out the loser', () => {
    const bracket = recordWinner(createBracket(['Ana', 'Ben']), 0, 0, 1);
    renderBracket({ rounds: viewOf(bracket) });

    expect(screen.getByText('Ben')).toHaveClass('font-bold');
    expect(screen.getByText('Ana')).toHaveClass('line-through');
    expect(screen.getByText('Winner')).toBeInTheDocument();
  });

  it('labels the highlighted pairing', () => {
    renderBracket({ rounds: viewOf(createBracket(['Ana', 'Ben', 'Cleo', 'Dan']), [0, 1]), currentLabel: 'Next match' });
    expect(screen.getAllByText('Next match')).toHaveLength(1);
  });

  it('shows the champion in a last column', () => {
    const bracket = recordWinner(createBracket(['Ana', 'Ben']), 0, 0, 0);
    renderBracket({ rounds: viewOf(bracket), champion: 'Ana' });

    const champion = screen.getByRole('heading', { level: 3, name: 'Champion' }).parentElement as HTMLElement;
    expect(within(champion).getByText('Ana')).toBeInTheDocument();
  });

  it('is a labelled group that can be reached with the keyboard, so it can scroll inside itself', async () => {
    const { container } = renderBracket({ rounds: viewOf(createBracket(['Ana', 'Ben', 'Cleo', 'Dan'])) });
    const region = screen.getByRole('group', { name: 'Bracket' });

    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveClass('overflow-x-auto');
    await expectNoA11yViolations(container);
  });
});
