
// WHY THIS FILE EXISTS
// Documentation only: what the friends and blocks routes put inside `data`.
// Keep in sync with friend-view.ts.

export class UserSummaryResponse {
  id: string;

  displayName: string;

  avatarUrl: string | null;

  online: boolean;
}

export class FriendResponse extends UserSummaryResponse {
  since: Date;
}

export class FriendsOverviewResponse {
  friends: FriendResponse[];

  incoming: UserSummaryResponse[];

  outgoing: UserSummaryResponse[];
}

export class FriendshipResultResponse {
  friendship: string;
}
