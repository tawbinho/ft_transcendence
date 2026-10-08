import type { DemoFeature } from '@/config';
import { DemoRouter } from './router';

describe('DemoRouter', () => {
  const router = new DemoRouter();
  const handler = () => null;
  router.add('chat', 'GET', '/chat/:userId/messages', handler);
  router.add('spectate', 'GET', '/matches/live', handler);
  router.add(null, 'GET', '/matches/:id', handler);
  const everything = new Set<DemoFeature>(['chat', 'spectate']);
  const nothing = new Set<DemoFeature>();

  it('matches the method and the whole path, and decodes parameters', () => {
    expect(router.match({ method: 'GET', path: '/chat/a%20b/messages' }, everything)?.params).toEqual({
      userId: 'a b',
    });
    expect(router.match({ method: 'POST', path: '/chat/u1/messages' }, everything)).toBeNull();
    expect(router.match({ method: 'GET', path: '/chat/u1/messages/2' }, everything)).toBeNull();
  });

  it('tries routes in the order they were added', () => {
    expect(router.match({ method: 'GET', path: '/matches/live' }, everything)?.route.feature).toBe('spectate');
    expect(router.match({ method: 'GET', path: '/matches/m1' }, everything)?.params).toEqual({ id: 'm1' });
  });

  it('skips the routes of features that are turned off', () => {
    expect(router.match({ method: 'GET', path: '/chat/u1/messages' }, nothing)).toBeNull();
    expect(router.match({ method: 'GET', path: '/matches/live' }, nothing)?.params).toEqual({ id: 'live' });
  });
});
