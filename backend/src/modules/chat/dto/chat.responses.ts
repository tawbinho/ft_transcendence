
// WHY THIS FILE EXISTS
// Documentation only: what the chat routes put inside `data`. Keep in sync
// with message-view.ts.

export class MessageResponse {
  id: string;

  senderId: string | null;

  kind: string;

  body: string;

  matchId: string | null;

  tournamentId: string | null;

  event: string | null;

  createdAt: Date;
}

export class MessagePageResponse {
  items: MessageResponse[];

  hasMore: boolean;

  peerReadAt: Date | null;
}

export class ConversationPeerResponse {
  id: string;

  displayName: string;

  avatarUrl: string | null;

  online: boolean;
}

export class ConversationResponse {
  peer: ConversationPeerResponse;

  lastMessage: MessageResponse;

  unread: number;

  peerReadAt: Date | null;

  blocked: boolean;
}

export class ReadResultResponse {
  readAt: Date;
}
