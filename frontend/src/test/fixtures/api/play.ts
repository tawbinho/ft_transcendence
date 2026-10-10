import { makeMatch } from '@/test/factories';
import type { FakeAnswers } from '@/test/fakeApi';
import { MATCH_ID } from '../ids';

// What the pages of this area ask the API for, for the route smoke test (app/routes.test.tsx).
export const answers: FakeAnswers = {
  [`GET /matches/${MATCH_ID}`]: makeMatch({ id: MATCH_ID }, [3, 3, 2]),
};
