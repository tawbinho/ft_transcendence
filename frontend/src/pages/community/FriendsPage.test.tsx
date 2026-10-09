import { screen, waitFor, within } from '@testing-library/react';
import { expectNoA11yViolations } from '@/test/axe';
import { fakeApi } from '@/test/fakeApi';
import { makeFriend } from '@/test/fixtures/community';
import { makeSummary, makeUser } from '@/test/fixtures/users';
import { renderRoute } from '@/test/render';

const overview = {
  friends: [
    makeFriend({ id: 'u3', displayName: 'carol', online: false }),
    makeFriend({ id: 'u4', displayName: 'dave', online: true }),
  ],
  incoming: [makeSummary({ id: 'u5', displayName: 'erin' })],
  outgoing: [makeSummary({ id: 'u6', displayName: 'frank' })],
};

const answers = (friends = overview) => ({ 'GET /friends': friends, 'GET /chat/conversations': [] });

describe('friends page', () => {
  it('lists the friends with online ones first', async () => {
    fakeApi(answers());
    renderRoute('/friends', { user: makeUser() });

    const list = await screen.findByRole('region', { name: 'Your friends' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('dave');
    expect(rows[1]).toHaveTextContent('carol');
    expect(within(list).getByText('Online now: 1')).toBeInTheDocument();
  });

  it('links each friend to a message and a challenge', async () => {
    fakeApi(answers());
    renderRoute('/friends', { user: makeUser() });

    expect(await screen.findByRole('link', { name: 'Message dave' })).toHaveAttribute('href', '/chat/dave');
    expect(screen.getByRole('link', { name: 'Challenge dave' })).toHaveAttribute('href', '/play/online?opponent=dave');
  });

  it('accepts a friend request', async () => {
    const api = fakeApi({ ...answers(), 'PUT /friends/:id': { friendship: 'friends' } });
    const { events } = renderRoute('/friends', { user: makeUser() });

    const requests = await screen.findByRole('region', { name: 'Friend requests' });
    expect(within(requests).getByText('Wants to be your friend')).toBeInTheDocument();
    await events.click(within(requests).getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(api.requests.some((r) => r.method === 'PUT' && r.path === '/friends/u5')).toBe(true));
  });

  it('declines a friend request', async () => {
    const api = fakeApi({ ...answers(), 'DELETE /friends/:id': { friendship: 'none' } });
    const { events } = renderRoute('/friends', { user: makeUser() });

    const requests = await screen.findByRole('region', { name: 'Friend requests' });
    await events.click(within(requests).getByRole('button', { name: 'Decline' }));

    await waitFor(() => expect(api.requests.some((r) => r.method === 'DELETE' && r.path === '/friends/u5')).toBe(true));
  });

  it('cancels a request the viewer sent', async () => {
    const api = fakeApi({ ...answers(), 'DELETE /friends/:id': { friendship: 'none' } });
    const { events } = renderRoute('/friends', { user: makeUser() });

    const sent = await screen.findByRole('region', { name: 'Sent requests' });
    await events.click(within(sent).getByRole('button', { name: 'Cancel request' }));

    await waitFor(() => expect(api.requests.some((r) => r.method === 'DELETE' && r.path === '/friends/u6')).toBe(true));
  });

  it('asks before removing a friend', async () => {
    const api = fakeApi({ ...answers(), 'DELETE /friends/:id': { friendship: 'none' } });
    const { events } = renderRoute('/friends', { user: makeUser() });

    const list = await screen.findByRole('region', { name: 'Your friends' });
    await events.click(within(list).getAllByRole('button', { name: 'Remove friend' })[0]!);
    expect(api.requests.some((r) => r.method === 'DELETE')).toBe(false);

    const dialog = await screen.findByRole('dialog');
    await events.click(within(dialog).getByRole('button', { name: 'Remove friend' }));
    await waitFor(() => expect(api.requests.some((r) => r.method === 'DELETE' && r.path === '/friends/u4')).toBe(true));
  });

  it('leaves out the request sections when there are none', async () => {
    fakeApi(answers({ ...overview, incoming: [], outgoing: [] }));
    renderRoute('/friends', { user: makeUser() });

    await screen.findByRole('region', { name: 'Your friends' });
    expect(screen.queryByRole('region', { name: 'Friend requests' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Sent requests' })).not.toBeInTheDocument();
  });

  it('suggests finding players when there are no friends', async () => {
    fakeApi(answers({ friends: [], incoming: [], outgoing: [] }));
    renderRoute('/friends', { user: makeUser() });

    expect(await screen.findByText(/No friends yet/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Find players' })[0]).toHaveAttribute('href', '/players');
  });

  it('sends blocked players to the settings instead of listing them', async () => {
    const api = fakeApi(answers());
    renderRoute('/friends', { user: makeUser() });

    expect(await screen.findByRole('link', { name: 'Manage blocked players' })).toHaveAttribute(
      'href',
      '/settings/blocked',
    );
    expect(api.requests.some((r) => r.path === '/blocks')).toBe(false);
  });

  it('has no accessibility problems', async () => {
    fakeApi(answers());
    const { container } = renderRoute('/friends', { user: makeUser() });

    await screen.findByRole('region', { name: 'Your friends' });
    await expectNoA11yViolations(container);
  });
});
