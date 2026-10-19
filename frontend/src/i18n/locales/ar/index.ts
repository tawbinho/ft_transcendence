import type { Messages } from '../en';
import { commonMessages } from './common';
import { shellMessages } from './shell';
import { homeMessages } from './home';
import { authMessages } from './auth';
import { playMessages } from './play';
import { tournamentsMessages } from './tournaments';
import { profileMessages } from './profile';
import { settingsMessages } from './settings';
import { communityMessages } from './community';
import { watchMessages } from './watch';
import { historyMessages } from './history';
import { infoMessages } from './info';

export const ar: Messages = {
  ...commonMessages,
  ...shellMessages,
  ...homeMessages,
  ...authMessages,
  ...playMessages,
  ...tournamentsMessages,
  ...profileMessages,
  ...settingsMessages,
  ...communityMessages,
  ...watchMessages,
  ...historyMessages,
  ...infoMessages,
};
