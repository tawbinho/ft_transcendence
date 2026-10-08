import type { User } from '@/features/auth/types';
import type { Conversation, Message } from '@/features/chat/types';
import { replay, type Seat } from '@/features/game/engine';
import type { Match, MatchSummary } from '@/features/matches/types';
import type { PlayerRef, Tournament, TournamentSummary } from '@/features/tournaments/types';
import type { Friendship, PlayerListItem, Profile, UserSummary } from '@/features/users/types';
import type { DemoDb, DemoMatch, DemoMessage, DemoPlayer, DemoTournament, ViewerState } from './db';

// Turns the demo world into the exact JSON shapes of the API contract.

/** Who is asking: the logged-in user and their part of the demo world. */
export interface Session {
  db: DemoDb;
  viewer: User;
  state: ViewerState;
}

export function findPlayer(db: DemoDb, id: string): DemoPlayer | undefined {
  return db.players.find((player) => player.id === id);
}

export function findPlayerByName(db: DemoDb, displayName: string): DemoPlayer | undefined {
  return db.players.find((player) => player.displayName === displayName);
}

/** The real user with the profile changes made in the demo. */
export function withProfileChanges(user: User, state: ViewerState): User {
  return {
    ...user,
    displayName: state.profile.displayName ?? user.displayName,
    avatarUrl: state.profile.avatarUrl !== undefined ? state.profile.avatarUrl : user.avatarUrl,
  };
}

export function playerSummary(player: DemoPlayer): UserSummary {
  return { id: player.id, displayName: player.displayName, avatarUrl: player.avatarUrl, online: player.online };
}

/** Anyone in the demo world: a made-up player or the viewer. */
export function userSummary(session: Session, id: string): UserSummary {
  if (id === session.viewer.id) {
    const { displayName, avatarUrl } = session.viewer;
    return { id, displayName, avatarUrl, online: true };
  }
  const player = findPlayer(session.db, id);
  return player ? playerSummary(player) : { id, displayName: '?', avatarUrl: null, online: false };
}

export function playerRef(session: Session, id: string): PlayerRef {
  const { displayName } = userSummary(session, id);
  return { id, displayName };
}

export function friendshipOf(state: ViewerState, id: string): Friendship {
  if (state.friends.some((friend) => friend.id === id)) return 'friends';
  if (state.outgoing.includes(id)) return 'request_sent';
  if (state.incoming.includes(id)) return 'request_received';
  return 'none';
}

export function profileOf(session: Session, player: DemoPlayer): Profile {
  return {
    ...playerSummary(player),
    createdAt: player.createdAt,
    lastSeenAt: player.online ? null : player.lastSeenAt,
    stats: player.stats,
    friendship: friendshipOf(session.state, player.id),
    blocked: session.state.blocked.includes(player.id),
  };
}

export function playerListItem(session: Session, player: DemoPlayer): PlayerListItem {
  return {
    ...playerSummary(player),
    createdAt: player.createdAt,
    stats: player.stats,
    friendship: friendshipOf(session.state, player.id),
  };
}

// ---- Matches ----------------------------------------------------------------

function seatOf(match: DemoMatch, userId: string): Seat | null {
  return match.players.find((player) => player.userId === userId)?.seat ?? null;
}

function winnerSeatOf(match: DemoMatch): Seat | null {
  return match.players.find((player) => player.result === 'win')?.seat ?? null;
}

export function matchView(match: DemoMatch, viewerId: string): Match {
  const state = replay(match.settings, match.moves);
  return {
    id: match.id,
    status: match.status,
    endReason: match.endReason,
    settings: { ...match.settings },
    createdAt: match.createdAt,
    startedAt: match.startedAt,
    endedAt: match.endedAt,
    players: match.players.map((player) => ({ ...player })),
    yourSeat: seatOf(match, viewerId),
    winnerSeat: winnerSeatOf(match),
    game: {
      board: state.board.map((column) => [...column]),
      current: match.status === 'in_progress' ? state.current : null,
      lastMove: state.lastMove,
      winningLine: state.winningLine ? [...state.winningLine] : null,
      moveCount: state.moveCount,
      moves: [...match.moves],
    },
  };
}

export function matchSummary(match: DemoMatch, viewerId: string): MatchSummary {
  return {
    id: match.id,
    status: match.status,
    endReason: match.endReason,
    settings: { ...match.settings },
    createdAt: match.createdAt,
    endedAt: match.endedAt,
    players: match.players.map((player) => ({ ...player })),
    yourSeat: seatOf(match, viewerId),
    winnerSeat: winnerSeatOf(match),
    moveCount: match.moves.length,
  };
}

// ---- Chat -------------------------------------------------------------------

export function messageView(session: Session, message: DemoMessage): Message {
  return {
    id: message.id,
    senderId: message.from === 'viewer' ? session.viewer.id : message.from === 'peer' ? message.peerId : null,
    kind: message.kind,
    body: message.body,
    matchId: message.matchId,
    tournamentId: message.tournamentId,
    event: message.event,
    createdAt: message.createdAt,
  };
}

export function messagesWith(state: ViewerState, peerId: string): DemoMessage[] {
  return state.messages.filter((message) => message.peerId === peerId);
}

export function unreadFrom(state: ViewerState, peerId: string): number {
  const readAt = state.readByViewer[peerId];
  return messagesWith(state, peerId).filter((m) => m.from !== 'viewer' && (!readAt || m.createdAt > readAt)).length;
}

export function conversationOf(session: Session, player: DemoPlayer): Conversation {
  const messages = messagesWith(session.state, player.id);
  const last = messages[messages.length - 1];
  return {
    peer: playerSummary(player),
    lastMessage: last ? messageView(session, last) : null,
    unread: unreadFrom(session.state, player.id),
    peerReadAt: session.state.readByPeer[player.id] ?? null,
    blocked: session.state.blocked.includes(player.id),
  };
}

// ---- Tournaments ------------------------------------------------------------

export function tournamentSummary(session: Session, tournament: DemoTournament): TournamentSummary {
  const final = tournament.bracket[tournament.bracket.length - 1]?.[0];
  const winnerId = final && final.winner !== null ? final.players[final.winner] : null;
  return {
    id: tournament.id,
    name: tournament.name,
    status: tournament.status,
    size: tournament.size,
    playerCount: tournament.players.length,
    settings: { ...tournament.settings },
    createdBy: playerRef(session, tournament.createdBy),
    createdAt: tournament.createdAt,
    winner: winnerId ? playerRef(session, winnerId) : null,
    joined: tournament.players.includes(session.viewer.id),
  };
}

export function tournamentView(session: Session, tournament: DemoTournament): Tournament {
  const user = (id: string | null) => (id === null ? null : userSummary(session, id));
  return {
    ...tournamentSummary(session, tournament),
    players: tournament.players.map((id) => userSummary(session, id)),
    rounds: tournament.bracket.map((round, r) => ({
      pairings: round.map((pairing, i) => {
        const extra = tournament.pairings[`${r}:${i}`];
        return {
          id: extra?.id ?? `${tournament.id}:${r}:${i}`,
          players: [user(pairing.players[0]), user(pairing.players[1])],
          matchId: extra?.matchId ?? null,
          winnerId: pairing.winner === null ? null : pairing.players[pairing.winner],
          bye: pairing.bye,
        };
      }),
    })),
    startedAt: tournament.startedAt,
    endedAt: tournament.endedAt,
  };
}
