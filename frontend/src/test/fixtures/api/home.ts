import type { FakeAnswers } from '@/test/fakeApi';
import { emptyPage } from '../pages';

// What the pages of this area ask the API for, for the route smoke test (app/routes.test.tsx).
// The header asks for the friend requests and the unread chats on every page; the member's
// home page asks for their matches and the live ones.
export const answers: FakeAnswers = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
  'GET /matches/mine': emptyPage(),
  'GET /matches/live': emptyPage(),
};
