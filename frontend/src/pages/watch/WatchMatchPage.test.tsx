import { screen } from '@testing-library/react';
import { ApiError } from '@/lib/api/errors';
import { makeMatch } from '@/test/factories';
import { expectNoA11yViolations } from '@/test/axe';
import { allowConsole } from '@/test/console';
import { fakeApi } from '@/test/fakeApi';
import { WATCH_MATCH_ID } from '@/test/fixtures/ids';
import { makeFinishedMatch } from '@/test/fixtures/matches';
import { makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

const quietApi = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};

const url = `/watch/${WATCH_MATCH_ID}`;
const answerWith = (match: object) => fakeApi({ ...quietApi, [`GET /matches/${WATCH_MATCH_ID}`]: match });
const boardPieces = (container: HTMLElement) => container.querySelectorAll('.board-grid .disc').length;

describe('spectator page', () => {
  it('follows a live match without replay controls', async () => {
    answerWith(makeMatch({ id: WATCH_MATCH_ID, yourSeat: null }, [3, 3, 2]));
    const { container } = renderRoute(url, { user: makeUser() });

    expect(await screen.findByText('bob to play')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Replay controls' })).not.toBeInTheDocument();
    expect(boardPieces(container)).toBe(3);
  });

  it('replays a finished match, opening on the result', async () => {
    answerWith(makeFinishedMatch({ id: WATCH_MATCH_ID, yourSeat: null }));
    const { container } = renderRoute(url, { user: makeUser() });

    expect(await screen.findByText('alice wins!')).toBeInTheDocument();
    expect(screen.getByText('Over')).toBeInTheDocument();
    expect(screen.getByText('Move 7 of 7')).toBeInTheDocument();
    expect(boardPieces(container)).toBe(7);
    await expectNoA11yViolations(container);
  });

  it('steps back and forth through the moves', async () => {
    answerWith(makeFinishedMatch({ id: WATCH_MATCH_ID, yourSeat: null }));
    const { events, container } = renderRoute(url, { user: makeUser() });

    await events.click(await screen.findByRole('button', { name: 'Previous move' }));
    expect(screen.getByText('Move 6 of 7')).toBeInTheDocument();
    expect(boardPieces(container)).toBe(6);
    expect(screen.queryByText('alice wins!')).not.toBeInTheDocument();

    await events.click(screen.getByRole('button', { name: 'Go to the start' }));
    expect(screen.getAllByText('Start of the match')).not.toHaveLength(0);
    expect(boardPieces(container)).toBe(0);

    await events.click(screen.getByRole('button', { name: 'Next move' }));
    expect(boardPieces(container)).toBe(1);
    expect(screen.getByText('alice played column 1.')).toBeInTheDocument();
    expect(screen.getByText('Move 1 of 7')).toBeInTheDocument();
  });

  it('announces each position to screen readers', async () => {
    answerWith(makeFinishedMatch({ id: WATCH_MATCH_ID, yourSeat: null }));
    const { events, container } = renderRoute(url, { user: makeUser() });

    await events.click(await screen.findByRole('button', { name: 'Previous move' }));

    const live = container.querySelector('section [aria-live="polite"]');
    expect(live).toHaveTextContent('Move 6 of 7: bob played column 2.');
  });

  it('lets a player of the match replay it, with a link back to their matches', async () => {
    answerWith(makeFinishedMatch({ id: WATCH_MATCH_ID }));
    renderRoute(url, { user: makeUser() });

    expect(await screen.findByRole('region', { name: 'Replay controls' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My matches' })).toHaveAttribute('href', '/matches');
    // The finished match is the viewer's: green banner for the win.
    expect(screen.getByText('alice wins!').parentElement).toHaveClass('bg-success-soft');
  });

  it('sends a player of a running match to the match page', async () => {
    answerWith(makeMatch({ id: WATCH_MATCH_ID }, [3]));
    fakeApi({
      ...quietApi,
      [`GET /matches/${WATCH_MATCH_ID}`]: makeMatch({ id: WATCH_MATCH_ID }, [3]),
    });
    const { router } = renderRoute(url, { user: makeUser() });

    await screen.findByRole('heading', { level: 1 });
    expect(router.state.location.pathname).toBe(`/matches/${WATCH_MATCH_ID}`);
  });

  it('shows a match cancelled before any move without controls', async () => {
    answerWith(
      makeFinishedMatch({
        id: WATCH_MATCH_ID,
        yourSeat: null,
        status: 'abandoned',
        winnerSeat: null,
        endReason: null,
        game: makeMatch().game,
      }),
    );
    renderRoute(url, { user: makeUser() });

    expect(await screen.findByText('This match was cancelled.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Replay controls' })).not.toBeInTheDocument();
  });

  it('explains when the match does not exist', async () => {
    allowConsole();
    fakeApi({
      ...quietApi,
      [`GET /matches/${WATCH_MATCH_ID}`]: new ApiError('MATCH_NOT_FOUND', 'Match not found', 404),
    });
    const { container } = renderRoute(url, { user: makeUser() });

    expect(await screen.findByRole('heading', { level: 1, name: 'Match unavailable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Live matches' })).toHaveAttribute('href', '/watch');
    await expectNoA11yViolations(container);
  });

  it('explains when the address is not a match at all', async () => {
    fakeApi(quietApi);
    renderRoute('/watch/not-a-match', { user: makeUser() });

    expect(await screen.findByRole('heading', { level: 1, name: 'Match unavailable' })).toBeInTheDocument();
  });
});
