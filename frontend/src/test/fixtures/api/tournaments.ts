import type { FakeAnswers } from '@/test/fakeApi';
import { TOURNAMENT_ID } from '../ids';
import { emptyPage } from '../pages';
import { makeTournament } from '../tournaments';

// What the pages of this area ask the API for, for the route smoke test (app/routes.test.tsx).
export const answers: FakeAnswers = {
  'GET /tournaments': emptyPage(),
  [`GET /tournaments/${TOURNAMENT_ID}`]: makeTournament(),
};
