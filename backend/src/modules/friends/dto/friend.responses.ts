import { ApiProperty } from '@nestjs/swagger';

// WHY THIS FILE EXISTS
// Documentation only: what the friends and blocks routes put inside `data`.
// Keep in sync with friend-view.ts.

export class UserSummaryResponse {
  @ApiProperty({ example: '2082b753-ec3c-480d-9ebb-edcfdb5ce293' })
  id: string;

  @ApiProperty({ example: 'mario' })
  displayName: string;

  @ApiProperty({ type: String, nullable: true, example: null })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Seen in the last minute' })
  online: boolean;
}

export class FriendResponse extends UserSummaryResponse {
  @ApiProperty({ type: Date, description: 'Friends since' })
  since: Date;
}

export class FriendsOverviewResponse {
  @ApiProperty({ type: [FriendResponse], description: 'Online first, then by name' })
  friends: FriendResponse[];

  @ApiProperty({ type: [UserSummaryResponse], description: 'Requests sent to me' })
  incoming: UserSummaryResponse[];

  @ApiProperty({ type: [UserSummaryResponse], description: 'Requests I sent, not answered yet' })
  outgoing: UserSummaryResponse[];
}

export class FriendshipResultResponse {
  @ApiProperty({ enum: ['none', 'friends', 'request_sent'] })
  friendship: string;
}
