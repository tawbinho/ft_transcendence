// English is the reference language: the fr and ar folders must have exactly the
// same keys (TypeScript checks it through the Messages type).
// Each area file holds whole sections; a section lives in exactly one file.

import { commonMessages } from './common';
import { shellMessages } from './shell';
import { homeMessages } from './home';
import { authMessages } from './auth';
import { playMessages } from './play';
import { tournamentsMessages } from './tournaments';
import { profileMessages } from './profile';
import { settingsMessages } from './settings';
import { communityMessages } from './community';
import { historyMessages } from './history';
import { infoMessages } from './info';

export const en = {
  ...commonMessages,
  ...shellMessages,
  ...homeMessages,
  ...authMessages,
  ...playMessages,
  ...tournamentsMessages,
  ...profileMessages,
  ...settingsMessages,
  ...communityMessages,
  ...historyMessages,
  ...infoMessages,
};

export type Messages = typeof en;
