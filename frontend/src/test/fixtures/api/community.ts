import type { FakeAnswers } from '@/test/fakeApi';
import { emptyPage } from '../pages';

// What the pages of this area ask the API for, for the route smoke test (app/routes.test.tsx).
export const answers: FakeAnswers = {
  'GET /users': emptyPage(),
  'GET /blocks': [],
  // bob's profile (see profile.ts) gives his id, u2.
  'GET /chat/u2/messages': { items: [], hasMore: false, peerReadAt: null },
};
