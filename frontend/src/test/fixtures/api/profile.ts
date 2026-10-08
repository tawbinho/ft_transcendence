import type { FakeAnswers } from '@/test/fakeApi';
import { emptyPage } from '../pages';
import { makeProfile } from '../users';

// What the pages of this area ask the API for, for the route smoke test (app/routes.test.tsx).
export const answers: FakeAnswers = {
  'GET /users/bob': makeProfile(),
  'GET /users/bob/matches': emptyPage(),
};
