import type { FakeAnswers } from '@/test/fakeApi';

// What the pages of this area ask the API for, for the route smoke test (app/routes.test.tsx).
// The header asks for the friend requests and the unread chats on every page.
export const answers: FakeAnswers = {
  'GET /friends': { friends: [], incoming: [], outgoing: [] },
  'GET /chat/conversations': [],
};
