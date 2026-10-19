
// WHY THIS FILE EXISTS
// Documentation only: these classes describe, for the Swagger page, what the
// users routes put inside `data`. Keep them in sync with user-view.ts.

export class ProfileStatsResponse {
  played: number;

  wins: number;

  losses: number;

  draws: number;
}

export class PlayerListItemResponse {
  id: string;

  displayName: string;

  avatarUrl: string | null;

  online: boolean;

  createdAt: Date;

  isBot: boolean;

  stats: ProfileStatsResponse;

  friendship: string;
}

export class PlayerPageResponse {
  items: PlayerListItemResponse[];

  total: number;

  limit: number;

  offset: number;
}

export class ProfileResponse {
  id: string;

  displayName: string;

  avatarUrl: string | null;

  online: boolean;

  createdAt: Date;

  lastSeenAt: Date | null;

  isBot: boolean;

  stats: ProfileStatsResponse;

  friendship: string;

  blocked: boolean;
}

export class ProfileMatchOpponentResponse {
  id: string;

  displayName: string;
}

export class ProfileMatchSettingsResponse {
  cols: number;

  rows: number;

  winLength: number;

  theme: string;
}

export class ProfileMatchResponse {
  id: string;

  opponent: ProfileMatchOpponentResponse;

  result: string;

  settings: ProfileMatchSettingsResponse;

  endedAt: Date;

  moveCount: number;
}

export class ProfileMatchPageResponse {
  items: ProfileMatchResponse[];

  total: number;

  limit: number;

  offset: number;
}
