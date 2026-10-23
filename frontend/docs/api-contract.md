# API contract

What the frontend expects from the backend: every route it calls, the JSON it sends and reads, the error codes it
translates and the live events it listens to.

Every route below exists in the backend (see the Status section at the end). The shapes below are copied from
`src/features/*/types.ts`, which the app is compiled against: if the two ever disagree, the TypeScript files are right.

## Routes at a glance

| Route                                             | Purpose                              | Backend |
| ------------------------------------------------- | ------------------------------------ | ------- |
| `POST /auth/signup`                               | Create an account, email a code      | Done    |
| `POST /auth/verify-email`, `resend-verification`  | Verify the email with the code       | Done    |
| `POST /auth/forgot-password`, `reset-password`    | Set a new password with a code       | Done    |
| `POST /auth/login`                                | Log in (may ask for a 2FA code)      | Done    |
| `POST /auth/2fa/verify`                           | Finish a login with a 2FA code       | Done    |
| `POST /auth/logout`                               | Log out                              | Done    |
| `GET /auth/me`                                    | The logged-in user, or null          | Done    |
| `POST /auth/2fa/setup`, `enable`, `disable`       | Turn 2FA on or off                   | Done    |
| `POST /matches`                                   | Create a match                       | Done    |
| `GET /matches/mine`                               | The viewer's matches                 | Done    |
| `GET /matches/:id`                                | One match                            | Done    |
| `POST /matches/:id/join`, `moves`, `resign`       | Play                                 | Done    |
| `GET /users`                                      | Player search                        | Done    |
| `GET /users/:displayName`                         | A profile                            | Done    |
| `GET /users/:displayName/matches`                 | A player's finished matches          | Done    |
| `PATCH /users/me`                                 | Change the display name              | Done    |
| `PUT` and `DELETE /users/me/avatar`               | Upload or remove the profile picture | Done    |
| `GET /friends`                                    | Friends and friend requests          | Done    |
| `PUT` and `DELETE /friends/:userId`               | Add, accept, cancel, decline, remove | Done    |
| `GET /chat/conversations`                         | The viewer's conversations           | Done    |
| `GET` and `POST /chat/:userId/messages`           | Read and send messages               | Done    |
| `POST /chat/:userId/read`                         | Mark a conversation as read          | Done    |
| `POST /chat/:userId/typing`                       | "Is typing" signal                   | Done    |
| `GET /blocks`, `PUT` and `DELETE /blocks/:userId` | Block and unblock                    | Done    |
| `GET` and `POST /tournaments`                     | List and create tournaments          | Done    |
| `GET` and `DELETE /tournaments/:id`               | Read and cancel a tournament         | Done    |
| `POST /tournaments/:id/join`, `leave`, `start`    | Register and start                   | Done    |
| Socket.IO on `/socket.io`                         | Live updates                         | Done    |

## Conventions

The backend follows these rules everywhere.

- **Base path.** Every route is under `/api`, on the same origin as the app: the HTTPS proxy sends `/api` and
  `/socket.io` to the backend and everything else to the frontend. The paths in this document leave `/api` out.
- **Session.** The httpOnly `session` cookie set at login. Every route needs it except signup, the email code routes,
  login, 2FA verify and `GET /auth/me`. Without a valid session the answer is `401 UNAUTHORIZED` and the app goes back
  to the login page.
- **Success.** Any 2xx status with `{ "data": ... }`. A route with nothing to return sends `{ "data": null }`.
- **Failure.** `{ "error": { "code": "EMAIL_TAKEN", "message": "This email is already registered" } }`. The app
  translates `code` (see [Error codes](#error-codes)) and shows `message` only for a code it does not know.
- **Validation.** A body or query that breaks a rule gets `400 VALIDATION_ERROR`, as the global `ValidationPipe` does
  today. The app checks the same rules before sending (`src/features/*/validation.ts`), so users rarely see it.
- **Ids and dates.** Ids are UUID strings. Dates are ISO 8601 strings in UTC, like `"2026-10-08T10:00:00.000Z"`.
- **Query values** arrive as text: booleans are `true` or `false`.
- **Pages.** Long lists take `limit` (1 to 50, default 20) and `offset` (default 0) and answer a page:

  ```ts
  interface Page<T> {
    items: T[];
    total: number; // every matching item, for the page count
    limit: number;
    offset: number;
  }
  ```

- **Rate limit.** 100 requests a minute per client address, fewer on signup, login and 2FA. Over the limit:
  `429 RATE_LIMITED`. See [Polling and the rate limit](#polling-and-the-rate-limit).

## Shared shapes

```ts
/** The logged-in user (backend: PublicUser), as the auth routes and the /users/me routes return it. */
interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null; // null: the app draws a default avatar
  locale: string;
  twoFactorEnabled?: boolean; // optional, see "Auth"
}

/** Any other player, wherever the app shows a name with a picture and an online dot. */
interface UserSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  online: boolean;
}

/** How the viewer relates to another player. */
type Friendship = 'self' | 'none' | 'friends' | 'request_sent' | 'request_received';

/** The board of a match or a tournament (limits: backend match.constants.ts). */
interface MatchSettings {
  cols: number; // 5 to 10
  rows: number; // 5 to 9
  winLength: number; // 3 to 5, and not more than cols or rows
  theme: string; // classic, ocean, sunset or midnight
}
```

**Online.** A player is online while they have the app open. With the live connection, that means "has at least one
open socket". Before it exists, a simple rule works: online when their last request is less than a minute old. An open,
visible tab of a logged-in player sends one at least every 30 seconds (the menu badges, see
[Polling](#polling-and-the-rate-limit)).

## Auth

Nothing to change. What the app uses:

| Route                            | Body                               | Answer                                                          |
| -------------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `POST /auth/signup`              | `{ email, displayName, password }` | `{ verificationSent: true }`, no cookie: nobody is logged in    |
| `POST /auth/verify-email`        | `{ email, code }`                  | `null`: the email is verified, the user can log in now          |
| `POST /auth/resend-verification` | `{ email }`                        | `null`, always (it never says whether the email exists)         |
| `POST /auth/forgot-password`     | `{ email }`                        | `null`, always; a verified account gets a reset code            |
| `POST /auth/reset-password`      | `{ email, code, password }`        | `null`: new password set, every login of the user ended         |
| `POST /auth/login`               | `{ email, password }`              | `{ user: User }` or `{ user: null, twoFactorRequired: true }`   |
| `POST /auth/2fa/verify`          | `{ code }`                         | `{ user: User }`                                                |
| `POST /auth/logout`              |                                    | `null`                                                          |
| `GET /auth/me`                   |                                    | `User`, or `null` (status 200) when nobody is logged in         |
| `POST /auth/2fa/setup`           |                                    | `{ qr, secret }`: the QR code as a data URL, the secret as text |
| `POST /auth/2fa/enable`          | `{ code }`                         | `null`                                                          |
| `POST /auth/2fa/disable`         | `{ code }`                         | `null`                                                          |

The forms check the backend's rules before sending: a display name has 3 to 20 letters, numbers, `_` or `-`; a
password has 8 to 128 characters; a code has 6 digits (spaces are removed).

**Email code.** Signing up does not log in. The backend emails a 6-digit code, and the app opens `/verify-email`
(`pages/auth/VerifyEmailPage.tsx`). Until the code is entered, login answers `403 EMAIL_NOT_VERIFIED` and emails a
new code; the login alert links to the code page. A code lasts 15 minutes, works once and stops after 5 wrong tries;
a new code replaces the old one. `/forgot-password` works the same way for a new password. The email goes out through
Gmail only when `SMTP_USER` and `SMTP_PASSWORD` are set in the root `.env`; without them the backend prints the code in
its log (`docker compose logs backend | grep "Code for"`).

**Backup codes.** The backend also answers `{ backupCodes }` (10 codes like `ABCDE-FGHJK`, shown once) when 2FA is
turned on, and accepts one of them instead of the 6 digits at login and to turn 2FA off
(`GET` and `POST /auth/2fa/backup-codes` count and renew them). The app shows them once after turning 2FA on and
accepts one at login and to turn 2FA off; it does not count or renew them.

**Optional:** add `twoFactorEnabled: boolean` to `User`. The account page then shows only the button that applies
(turn on or turn off). Without it, it shows both and handles `TWO_FACTOR_ALREADY_ENABLED` and `TWO_FACTOR_NOT_ENABLED`.

## Matches

### Shapes

```ts
type MatchStatus = 'waiting' | 'in_progress' | 'finished' | 'abandoned';
type MatchEndReason = 'win' | 'draw' | 'resign' | 'disconnect';

interface MatchPlayer {
  seat: 1 | 2; // seat 1 plays first
  userId: string;
  displayName: string;
  result: 'win' | 'loss' | 'draw' | null; // null until the match is over
}

interface Match {
  id: string;
  status: MatchStatus;
  endReason: MatchEndReason | null;
  settings: MatchSettings;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  players: MatchPlayer[]; // ordered by seat
  yourSeat: 1 | 2 | null; // null when the viewer is not a player
  winnerSeat: 1 | 2 | null;
  game: {
    board: (0 | 1 | 2)[][]; // board[col][row], row 0 at the bottom, 0 = empty
    current: 1 | 2 | null; // whose turn it is; null unless in progress
    lastMove: { col: number; row: number } | null;
    winningLine: { col: number; row: number }[] | null;
    moveCount: number;
    moves: number[]; // the columns played, in order
  };
}

/** A row of a match list: a Match without `game`, with its number of moves. */
interface MatchSummary {
  id: string;
  status: MatchStatus;
  endReason: MatchEndReason | null;
  settings: MatchSettings;
  createdAt: string;
  endedAt: string | null;
  players: MatchPlayer[];
  yourSeat: 1 | 2 | null;
  winnerSeat: 1 | 2 | null;
  moveCount: number;
}
```

### Routes

| Route                      | Body or query                         | Answer                                                    |
| -------------------------- | ------------------------------------- | --------------------------------------------------------- |
| `POST /matches`            | `{ settings?, opponentDisplayName? }` | `Match`                                                   |
| `GET /matches/mine`        | `status?`, `limit`, `offset`          | `Page<MatchSummary>`, newest first                        |
| `GET /matches/:id`         |                                       | `Match`                                                   |
| `POST /matches/:id/join`   |                                       | `Match`                                                   |
| `POST /matches/:id/moves`  | `{ col }`                             | `Match`                                                   |
| `POST /matches/:id/resign` |                                       | `Match` (a match still waiting is cancelled: `abandoned`) |

### Who can read a match

While a match waits for its second player, `GET /matches/:id` answers anyone logged in, with `yourSeat: null`, so the
person who got the link sees the join screen. Once it starts, only its players can read it: anyone else gets
`404 MATCH_NOT_FOUND`, and the app shows the join screen, where joining is then refused.

### Computer opponents

`AI_Easy`, `AI_Medium` and `AI_Hard` are accounts of the backend that nobody logs in as. `POST /matches` with one of
them as `opponentDisplayName` creates the match like any invitation; the server then joins it for the computer at once
and plays the computer's moves through the same routes and `match:update` events as a person's. The app sends nothing
special: the Play page's three levels open the match form with the name filled in.

### Blocked players

`POST /matches` with the `opponentDisplayName` of a player the viewer blocked, or who blocked the viewer:
`403 BLOCKED`.

## Players

```ts
/** Finished matches only: abandoned ones do not count. played = wins + losses + draws. */
interface ProfileStats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
}

/** A row of the player search. */
interface PlayerListItem extends UserSummary {
  createdAt: string;
  stats: ProfileStats;
  friendship: Friendship;
}

interface Profile extends UserSummary {
  createdAt: string;
  lastSeenAt: string | null; // when they were last online; null while online
  stats: ProfileStats;
  friendship: Friendship;
  blocked: boolean; // the viewer blocked this player
}

/** A finished match on a profile, from the profile owner's side. */
interface ProfileMatch {
  id: string;
  opponent: { id: string; displayName: string };
  result: 'win' | 'loss' | 'draw';
  settings: MatchSettings;
  endedAt: string;
  moveCount: number;
}
```

### `GET /users`

The player search. Answer: `Page<PlayerListItem>`. The viewer is in the results too, with `friendship: 'self'`.

| Query     | Values                                                                                   | Default     |
| --------- | ---------------------------------------------------------------------------------------- | ----------- |
| `search`  | Part of a display name, case-insensitive                                                 | All players |
| `online`  | `true`: only players online now                                                          | `false`     |
| `friends` | `true`: only the viewer's friends                                                        | `false`     |
| `sort`    | `name` (A to Z), `wins` (most wins first, then by name), `newest` (newest account first) | `name`      |
| `limit`   | 1 to 50                                                                                  | 20          |
| `offset`  | 0 or more                                                                                | 0           |

The Players page keeps these in its URL and sends the search 300 ms after the last key press.

### `GET /users/:displayName`

A player's `Profile`. The display name must match exactly, as stored (profile pages have URLs like `/users/alice`).
The viewer's own profile has `friendship: 'self'` and `online: true`. Unknown name: `404 USER_NOT_FOUND`.

### `GET /users/:displayName/matches`

A player's finished matches, newest first (by `endedAt`): `Page<ProfileMatch>`, with `limit` and `offset`. Every
logged-in user can read every player's history. Unknown name: `404 USER_NOT_FOUND`.

### `PATCH /users/me`

Body: `{ displayName }`, with the signup rules (trimmed, 3 to 20 letters, numbers, `_` or `-`). Answer: the updated
`User`. A name already in use: `409 DISPLAY_NAME_TAKEN`.

### `PUT /users/me/avatar`

The new profile picture, as `multipart/form-data` in the field `avatar`. Answer: the updated `User`, whose `avatarUrl`
shows the new picture.

- PNG, JPEG or WebP, 2 MB at most. Otherwise `415 AVATAR_INVALID_TYPE` or `413 AVATAR_TOO_LARGE`. Check the file's
  content, not only the type the browser declares.
- The app crops the picture to a square and shrinks it to 256 × 256 pixels (WebP, or PNG where the browser cannot
  write WebP) before sending it, so uploads are small. The proxy already accepts bodies up to 5 MB.
- Serve the pictures under `/api`, for example `/api/avatars/<file>`: the proxy sends only `/api` and `/socket.io` to
  the backend. Give each new picture a new file name, so browsers never show an old copy from their cache.

### `DELETE /users/me/avatar`

Back to the default avatar (`avatarUrl: null`). Answer: the updated `User`.

## Friends

```ts
interface Friend extends UserSummary {
  since: string; // when the friendship started
}

interface FriendsOverview {
  friends: Friend[]; // online first, then by name
  incoming: UserSummary[]; // requests other players sent to the viewer
  outgoing: UserSummary[]; // requests the viewer sent, not answered yet
}
```

| Route                     | What it does                                                         | Answer                             |
| ------------------------- | -------------------------------------------------------------------- | ---------------------------------- |
| `GET /friends`            |                                                                      | `FriendsOverview`                  |
| `PUT /friends/:userId`    | Sends a friend request, or accepts theirs if they already sent one   | `{ friendship }` after the change  |
| `DELETE /friends/:userId` | Removes the friend, cancels the viewer's request, or declines theirs | `{ friendship }`, so always `none` |

- Both are idempotent: `PUT` to a friend, or to a player who already has the viewer's request, changes nothing and
  answers the current `friendship`. `DELETE` with nothing to remove answers `none`.
- Errors: the viewer's own id `400 CANNOT_FRIEND_SELF`, an unknown id `404 USER_NOT_FOUND`, and for `PUT`
  `403 BLOCKED` when either player blocked the other.
- Every change sends `friends:update` to both players.

## Chat and blocks

Private conversations between two players. Messages are kept (the history), and each has a kind:

- `text`: written by a player, 1 to 500 characters.
- `invite`: a player invites the other to a match they created for them. The app shows a card with a Join button.
- `system`: written by the server. `event: 'tournament_match'` means "your tournament match against this player is
  ready". The app writes the sentence in the reader's language.

```ts
interface Message {
  id: string;
  senderId: string | null; // null for system messages
  kind: 'text' | 'invite' | 'system';
  body: string; // the text; empty for invites and system messages
  matchId: string | null; // invites and tournament notices: the match to open
  tournamentId: string | null; // tournament notices: the tournament to open
  event: 'tournament_match' | null; // system messages: what happened
  createdAt: string;
}

interface Conversation {
  peer: UserSummary;
  lastMessage: Message | null;
  unread: number; // messages from the peer the viewer has not read
  peerReadAt: string | null; // the peer read the viewer's messages up to this time
  blocked: boolean; // the viewer blocked the peer
}

interface MessagePage {
  items: Message[]; // oldest first
  hasMore: boolean; // older messages exist
  peerReadAt: string | null;
}
```

| Route                         | Body or query               | Answer                                          |
| ----------------------------- | --------------------------- | ----------------------------------------------- |
| `GET /chat/conversations`     |                             | `Conversation[]`, latest message first          |
| `GET /chat/:userId/messages`  | `before?`, `limit?`         | `MessagePage`                                   |
| `POST /chat/:userId/messages` | `{ body }` or `{ matchId }` | The new `Message`                               |
| `POST /chat/:userId/read`     |                             | `{ readAt }`                                    |
| `POST /chat/:userId/typing`   |                             | `null`                                          |
| `GET /blocks`                 |                             | `UserSummary[]`: the players the viewer blocked |
| `PUT /blocks/:userId`         |                             | `null`                                          |
| `DELETE /blocks/:userId`      |                             | `null`                                          |

`:userId` is always the other player. For all of these, an unknown id is `404 USER_NOT_FOUND` and the viewer's own id
is `400 VALIDATION_ERROR`.

**Conversations.** One per player the viewer has at least one message with, system messages included. Not paginated.

**Reading messages.** Without `before`: the latest `limit` messages (1 to 100, default 30). With `before`, the id of a
message of this conversation: the `limit` messages just before it, which is how the app loads older messages when the
reader scrolls up. `hasMore` says whether older ones remain. A `before` from another conversation is
`400 VALIDATION_ERROR`.

**Sending.**

- Text: `{ body }`, trimmed, 1 to 500 characters, otherwise `400 VALIDATION_ERROR`.
- Invite: `{ matchId }`, a match that is `waiting`, was created by the sender, and is reserved for this player
  (`POST /matches` with their `opponentDisplayName`). Anything else is `400 INVALID_INVITE`. The message gets
  `kind: 'invite'` and an empty `body`.
- `403 BLOCKED` when either player blocked the other.
- Sends `chat:message` to both players, so the sender's other tabs see it too.

**Read receipts.** `POST /chat/:userId/read` marks every message that player sent so far as read and answers the
time. The app calls it when a new message from the peer is on screen in a visible tab. It sends `chat:read` to that
player, whose app then shows "Seen" under their messages. `unread` counts the peer's messages sent after the viewer's
last read time.

**Typing.** `POST /chat/:userId/typing` stores nothing: it only sends `chat:typing` to that player. The app calls it at
most once every 3 seconds while the viewer types, and hides "is typing" 5 seconds after the last signal.

**Blocking.**

- `PUT /blocks/:userId` also ends any friendship or friend request between the two, and sends `friends:update` to both.
  Both block routes are idempotent.
- While either player blocks the other, messages and friend requests between them are refused with `403 BLOCKED`.
  Their earlier messages stay.
- `Profile.blocked` and `Conversation.blocked` say whether the viewer blocked that player. The app then shows "Unblock"
  instead of the message box.

## Tournaments

Online tournaments: a single-elimination bracket with 4 or 8 places.

```ts
type TournamentStatus = 'registering' | 'running' | 'finished';

interface PlayerRef {
  id: string;
  displayName: string;
}

interface TournamentSummary {
  id: string;
  name: string;
  status: TournamentStatus;
  size: 4 | 8; // places
  playerCount: number;
  settings: MatchSettings; // the board of every match of the tournament
  createdBy: PlayerRef;
  createdAt: string;
  winner: PlayerRef | null;
  joined: boolean; // the viewer is registered
}

interface Tournament extends TournamentSummary {
  players: UserSummary[]; // in order of registration
  rounds: { pairings: Pairing[] }[]; // empty until the start; rounds[0] is the first round
  startedAt: string | null;
  endedAt: string | null;
}

interface Pairing {
  id: string;
  players: [UserSummary | null, UserSummary | null]; // null: waiting for an earlier winner, or empty (bye)
  matchId: string | null; // the match of this pairing, once both players are known
  winnerId: string | null;
  bye: boolean; // one player had no opponent and went through without playing
}
```

| Route                         | Body or query                | Answer                                    |
| ----------------------------- | ---------------------------- | ----------------------------------------- |
| `GET /tournaments`            | `status?`, `limit`, `offset` | `Page<TournamentSummary>`, newest first   |
| `POST /tournaments`           | `{ name, size, settings? }`  | `Tournament`, with the creator registered |
| `GET /tournaments/:id`        |                              | `Tournament`                              |
| `POST /tournaments/:id/join`  |                              | `Tournament`                              |
| `POST /tournaments/:id/leave` |                              | `Tournament`                              |
| `POST /tournaments/:id/start` |                              | `Tournament`                              |
| `DELETE /tournaments/:id`     |                              | `null`                                    |

**Creating.** `name`: trimmed, 3 to 30 characters among letters, numbers, spaces and `- _ ' .`, starting with a letter
or a number. `size`: 4 or 8. `settings`: as for `POST /matches`, the classic board when left out. Anything else is
`400 VALIDATION_ERROR`.

**Registration**, while the status is `registering`:

- Join: `409 ALREADY_JOINED`, `409 TOURNAMENT_FULL`. Taking the last place starts the tournament at once.
- Leave: `409 NOT_JOINED`. The creator cannot leave (`409 CREATOR_CANNOT_LEAVE`): they cancel instead.
- Start before it is full: creator only (`403 NOT_CREATOR`), with at least 3 players (`409 NOT_ENOUGH_PLAYERS`).
- Cancel (`DELETE`): creator only (`403 NOT_CREATOR`).
- Once registration is over, these four answer `409 TOURNAMENT_NOT_OPEN`. An unknown id is `404 TOURNAMENT_NOT_FOUND`.

**Running the bracket.**

1. At the start, the players are shuffled into a bracket whose size is the next power of two: 4 for 3 or 4 players, 8
   for 5 to 8.
2. The empty places are byes. The first pairings get them, one each, so no pairing is left empty, and a player with a
   bye goes straight to the second round.
3. As soon as both players of a pairing are known, the server creates their match: both seated, `in_progress` at once,
   seats drawn at random, the tournament's settings. It sets the pairing's `matchId` and adds a `system` message
   (`event: 'tournament_match'`, with `matchId` and `tournamentId`) to the conversation of the two players.
4. The players use the normal match routes. When the match ends with a winner (a resignation included), the winner of
   pairing `i` in round `r` moves to pairing `floor(i / 2)` of round `r + 1`, in place `i % 2`. A draw is replayed: a
   new match for the same pairing, with a new notice.
5. When the final has a winner, the tournament gets `status: 'finished'`, its `winner` and `endedAt`.

Every change (registration, start, a result, a new match, the end, a cancellation) sends `tournament:update`.

The backend builds the bracket and moves winners on by itself. A match nobody plays is decided by a turn timeout: in a
tournament match, the player whose turn it is loses if no move is made for 180 seconds (the clock restarts after each
move). The app shows whatever the bracket says.

## Live updates (Socket.IO)

The app opens a Socket.IO connection after login and updates the pages as events arrive; polling then slows down to
every 30 seconds. It still works without them, because every page also polls.

**Connecting.**

- Same origin, the default path `/socket.io`, WebSocket transport only:
  `io({ withCredentials: true, transports: ['websocket'] })`. The proxy already forwards WebSocket upgrades.
- The browser sends the `session` cookie with the handshake. Check it there, refuse the connection without a valid
  session, and put the socket in a room of its user (for example `user:<id>`) so events reach every tab of that user.
- After a reconnection, the app sends `match:watch` again for the matches on screen.

**From the app to the server.**

| Event           | Payload       | What the server does                                                             |
| --------------- | ------------- | -------------------------------------------------------------------------------- |
| `match:watch`   | `{ matchId }` | Adds the socket to the room of that match (the app sends it for its own matches) |
| `match:unwatch` | `{ matchId }` | Removes it                                                                       |

**From the server to the app.** Events are hints: the app never depends on receiving one, and a missed event only
delays an update until the next poll.

| Event               | Payload                        | Sent to                                      | When                                                                                                         |
| ------------------- | ------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `match:update`      | `Match`                        | The room of the match                        | Every change: join, move, resignation, end                                                                   |
| `chat:message`      | `{ peerId, message: Message }` | Both players                                 | A message is sent. `peerId` is the other player, seen by the receiver                                        |
| `chat:typing`       | `{ userId }`                   | The other player                             | `POST /chat/:userId/typing`. `userId` is the one typing                                                      |
| `chat:read`         | `{ userId, readAt }`           | The other player                             | `POST /chat/:userId/read`. `userId` is the one who read                                                      |
| `presence`          | `{ userId, online }`           | Everyone, or at least friends and chat peers | A user's first socket connects, or their last one disconnects                                                |
| `friends:update`    | `{}`                           | Both players                                 | A friend request is sent, accepted, declined or cancelled, a friend is removed, or a block ends a friendship |
| `tournament:update` | `{ id }`                       | Everyone                                     | Registration, start, a result, a new match, the end, a cancellation                                          |

- `match:update` can be one payload for the whole room: the app ignores `yourSeat` in events and keeps the seat from
  its own `GET /matches/:id`. It also ignores an event that shows fewer moves than the screen already does.
- When a user's last socket disconnects, set their `lastSeenAt`.

## Polling and the rate limit

Each page refreshes its data on a timer while its tab is visible:

| Data                                  | Where               | Every                                                 | With live events |
| ------------------------------------- | ------------------- | ----------------------------------------------------- | ---------------- |
| A match waiting for its second player | Match page          | 2 s                                                   | 2 s              |
| A match being played                  | Match page          | 2 s, or 5 s on the viewer's own turn; stops once over | 30 s             |
| The messages of the open conversation | Chat page           | 5 s                                                   | 30 s             |
| The conversation list                 | Chat page           | 10 s                                                  | 30 s             |
| The unread messages badge             | Menu, on every page | 15 s                                                  | 30 s             |
| Friends and friend requests           | Friends page        | 20 s                                                  | 30 s             |
| The friend requests badge             | Menu, on every page | 30 s                                                  | 30 s             |
| The tournament list                   | Tournaments page    | 10 s                                                  | 30 s             |
| One tournament                        | Tournament page     | 3 s until it is finished                              | 30 s             |

The backend allows 100 requests a minute per address. A player waiting for their opponent's move sends about 30 match
requests a minute, plus 6 for the menu badges. Two players testing on one computer share one address and stay under
the limit (about 70 at most); three or more busy tabs on one computer can reach it. The app then shows "Too many
attempts" and recovers by itself on the next poll.

With live updates on, polling drops to every 30 seconds, and a minute of chat between two windows on one computer uses
about 40 requests of the busiest route. Many busy tabs or fast reloads on one computer can still reach the limit;
leaving the read-only `GET` routes out of it, and keeping the strict limits on the auth routes, would remove the
problem.

## Error codes

Each code below has a translation in English, French and Arabic (`errors` in `src/i18n/locales/*/common.ts`). A code without
one shows the server's English `message`.

| Code                         | Status   | Where                                                          |
| ---------------------------- | -------- | -------------------------------------------------------------- |
| `VALIDATION_ERROR`           | 400      | Any route: the body or the query breaks a rule                 |
| `UNAUTHORIZED`               | 401      | Any route that needs a session                                 |
| `FORBIDDEN`, `NOT_FOUND`     | 403, 404 | Errors without a code of their own (a guard, an unknown route) |
| `RATE_LIMITED`               | 429      | Any route                                                      |
| `INTERNAL_ERROR`             | 500      | Any route                                                      |
| `INVALID_CREDENTIALS`        | 401      | Login                                                          |
| `EMAIL_NOT_VERIFIED`         | 403      | Login before the email code was entered                        |
| `INVALID_VERIFICATION_CODE`  | 400      | `POST /auth/verify-email`                                      |
| `INVALID_RESET_CODE`         | 400      | `POST /auth/reset-password`                                    |
| `EMAIL_SEND_FAILED`          | 502      | Signup, when the email could not be sent (nothing is created)  |
| `EMAIL_TAKEN`                | 409      | Signup                                                         |
| `DISPLAY_NAME_TAKEN`         | 409      | Signup, and `PATCH /users/me`                                  |
| `INVALID_2FA_CODE`           | 400      | 2FA verify, enable and disable                                 |
| `TWO_FACTOR_ALREADY_ENABLED` | 409      | 2FA setup                                                      |
| `TWO_FACTOR_NOT_ENABLED`     | 409      | 2FA disable                                                    |
| `TWO_FACTOR_NOT_PENDING`     | 409      | 2FA enable without a setup first                               |
| `USER_NOT_FOUND`             | 404      | `POST /matches`, and the players, friends and chat routes      |
| `CANNOT_INVITE_SELF`         | 400      | `POST /matches`                                                |
| `INVALID_SETTINGS`           | 400      | `POST /matches`: the win length does not fit the board         |
| `TOO_MANY_WAITING_MATCHES`   | 409      | `POST /matches`: 3 matches already wait for an opponent        |
| `MATCH_NOT_FOUND`            | 404      | Match routes                                                   |
| `MATCH_NOT_JOINABLE`         | 409      | Join                                                           |
| `ALREADY_IN_MATCH`           | 409      | Join                                                           |
| `NOT_INVITED`                | 403      | Join                                                           |
| `MATCH_NOT_ACTIVE`           | 409      | Move, resign                                                   |
| `NOT_YOUR_TURN`              | 409      | Move                                                           |
| `COLUMN_FULL`                | 409      | Move                                                           |
| `INVALID_COLUMN`             | 400      | Move                                                           |
| `BLOCKED`                    | 403      | Messages, friend requests, match invitations                   |
| `CANNOT_FRIEND_SELF`         | 400      | `PUT /friends/:userId`                                         |
| `INVALID_INVITE`             | 400      | `POST /chat/:userId/messages` with a `matchId`                 |
| `AVATAR_INVALID_TYPE`        | 415      | `PUT /users/me/avatar`                                         |
| `AVATAR_TOO_LARGE`           | 413      | `PUT /users/me/avatar`                                         |
| `TOURNAMENT_NOT_FOUND`       | 404      | Tournament routes                                              |
| `TOURNAMENT_NOT_OPEN`        | 409      | Join, leave, start or cancel after registration                |
| `TOURNAMENT_FULL`            | 409      | Join                                                           |
| `ALREADY_JOINED`             | 409      | Join                                                           |
| `NOT_JOINED`                 | 409      | Leave                                                          |
| `CREATOR_CANNOT_LEAVE`       | 409      | Leave                                                          |
| `NOT_CREATOR`                | 403      | Start, cancel                                                  |
| `NOT_ENOUGH_PLAYERS`         | 409      | Start                                                          |

The app makes three more codes itself; the server never sends them:

- `NETWORK_ERROR`: the server could not be reached at all.
- `SERVER_UNAVAILABLE`: a 5xx answer without the JSON envelope, like the proxy's 502 while the backend restarts.
- `BAD_RESPONSE`: any other answer without the JSON envelope.

## Status

Every route and live event in this document is served by the backend (`backend/docs/openapi.yaml` is the reference
the backend is built from). The in-browser demo server and its `VITE_DEMO_FEATURES` switch were removed once the last
feature, chat, was built.
