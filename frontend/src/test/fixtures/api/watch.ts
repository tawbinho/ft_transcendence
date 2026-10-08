import { makeMatch } from '@/test/factories';
import type { FakeAnswers } from '@/test/fakeApi';
import { WATCH_MATCH_ID } from '../ids';
import { emptyPage } from '../pages';

// What the pages of this area ask the API for, for the route smoke test (app/routes.test.tsx).
export const answers: FakeAnswers = {
  'GET /matches/live': emptyPage(),
  [`GET /matches/${WATCH_MATCH_ID}`]: makeMatch({ id: WATCH_MATCH_ID, yourSeat: null }, [3, 3, 2]),
};
