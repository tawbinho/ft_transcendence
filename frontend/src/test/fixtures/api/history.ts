import type { FakeAnswers } from '@/test/fakeApi';
import { emptyPage } from '../pages';

// What the pages of this area ask the API for, for the route smoke test (app/routes.test.tsx).
export const answers: FakeAnswers = {
  'GET /matches/mine': emptyPage(),
};
