import { ApiProperty } from '@nestjs/swagger';

// WHY THIS FILE EXISTS
// Documentation only: what the chat routes put inside `data`. Keep in sync
// with message-view.ts.

export class MessageResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: String, nullable: true, description: 'null: written by the server' })
  senderId: string | null;

  @ApiProperty({ enum: ['text', 'invite', 'system'] })
  kind: string;

  @ApiProperty({ description: 'The text; empty for invitations and system messages' })
  body: string;

  @ApiProperty({ type: String, nullable: true, description: 'Invitations and tournament notices: the match to open' })
  matchId: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Tournament notices: the tournament to open' })
  tournamentId: string | null;

  @ApiProperty({ type: String, nullable: true, enum: ['tournament_match'] })
  event: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;
}

export class MessagePageResponse {
  @ApiProperty({ type: [MessageResponse], description: 'Oldest first' })
  items: MessageResponse[];

  @ApiProperty({ description: 'Older messages exist: ask again with `before` = the id of the oldest one' })
  hasMore: boolean;

  @ApiProperty({ type: Date, nullable: true, description: 'The peer read your messages up to this time' })
  peerReadAt: Date | null;
}

export class ConversationPeerResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty()
  online: boolean;
}

export class ConversationResponse {
  @ApiProperty({ type: ConversationPeerResponse })
  peer: ConversationPeerResponse;

  @ApiProperty({ type: MessageResponse })
  lastMessage: MessageResponse;

  @ApiProperty({ description: "Messages from the peer you have not read" })
  unread: number;

  @ApiProperty({ type: Date, nullable: true })
  peerReadAt: Date | null;

  @ApiProperty({ description: 'You blocked the peer' })
  blocked: boolean;
}

export class ReadResultResponse {
  @ApiProperty({ type: Date })
  readAt: Date;
}
