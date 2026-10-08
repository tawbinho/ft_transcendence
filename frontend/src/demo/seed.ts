import type { Difficulty } from '@/features/game/bot';
import { DEFAULT_BOARD_SETTINGS } from '@/features/game/settings';
import { createBracket, recordWinner, shuffle } from '@/features/tournaments/bracket';
import {
  DB_VERSION,
  newId,
  type DemoDb,
  type DemoMessage,
  type DemoPlayer,
  type DemoTournament,
  type ViewerState,
} from './db';

// The made-up players and the starting situation of the demo world.

const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

/** A small picture (two discs) as an SVG data URL, for players with an avatar. */
function discAvatar(background: string, first: string, second: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" fill="${background}"/>` +
    `<circle cx="22" cy="38" r="13" fill="${first}"/>` +
    `<circle cx="42" cy="26" r="13" fill="${second}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface PlayerSeed {
  name: string;
  online: boolean;
  level: Difficulty;
  played: number;
  winRate: number;
  joinedDaysAgo: number;
  avatar?: [string, string, string];
}

const PLAYERS: PlayerSeed[] = [
  {
    name: 'lina',
    online: true,
    level: 'medium',
    played: 64,
    winRate: 0.58,
    joinedDaysAgo: 210,
    avatar: ['#1e3a8a', '#ef4444', '#facc15'],
  },
  { name: 'omar_k', online: true, level: 'medium', played: 120, winRate: 0.62, joinedDaysAgo: 340 },
  {
    name: 'sofia',
    online: false,
    level: 'easy',
    played: 18,
    winRate: 0.39,
    joinedDaysAgo: 45,
    avatar: ['#0f766e', '#f97316', '#e0f2fe'],
  },
  { name: 'kenji', online: true, level: 'medium', played: 87, winRate: 0.55, joinedDaysAgo: 160 },
  { name: 'amara', online: true, level: 'easy', played: 31, winRate: 0.42, joinedDaysAgo: 75 },
  {
    name: 'lucas-b',
    online: false,
    level: 'medium',
    played: 52,
    winRate: 0.5,
    joinedDaysAgo: 120,
    avatar: ['#3b0764', '#22d3ee', '#f472b6'],
  },
  { name: 'noor', online: true, level: 'medium', played: 96, winRate: 0.6, joinedDaysAgo: 280 },
  { name: 'mateo', online: false, level: 'easy', played: 12, winRate: 0.33, joinedDaysAgo: 20 },
  { name: 'yuki', online: true, level: 'easy', played: 25, winRate: 0.48, joinedDaysAgo: 60 },
  { name: 'elif', online: false, level: 'medium', played: 70, winRate: 0.57, joinedDaysAgo: 190 },
  { name: 'jonas', online: true, level: 'easy', played: 9, winRate: 0.44, joinedDaysAgo: 8 },
  {
    name: 'zara',
    online: true,
    level: 'medium',
    played: 143,
    winRate: 0.66,
    joinedDaysAgo: 400,
    avatar: ['#7c2d12', '#fde047', '#38bdf8'],
  },
  { name: 'hadi', online: false, level: 'medium', played: 40, winRate: 0.53, joinedDaysAgo: 100 },
  { name: 'ines', online: true, level: 'easy', played: 15, winRate: 0.4, joinedDaysAgo: 30 },
];

function makePlayer(seed: PlayerSeed): DemoPlayer {
  const wins = Math.round(seed.played * seed.winRate);
  const draws = Math.round(seed.played * 0.06);
  return {
    id: newId(),
    displayName: seed.name,
    avatarUrl: seed.avatar ? discAvatar(...seed.avatar) : null,
    createdAt: ago(seed.joinedDaysAgo * DAY),
    online: seed.online,
    lastSeenAt: seed.online ? null : ago((1 + (seed.played % 9)) * 60 * MINUTE),
    stats: { played: seed.played, wins, draws, losses: seed.played - wins - draws },
    level: seed.level,
  };
}

const settings = () => ({ ...DEFAULT_BOARD_SETTINGS });

function byName(players: DemoPlayer[], name: string): DemoPlayer {
  const player = players.find((p) => p.displayName === name);
  if (!player) throw new Error(`No demo player ${name}`);
  return player;
}

function tournament(
  fields: Partial<DemoTournament> & Pick<DemoTournament, 'name' | 'size' | 'createdBy' | 'players'>,
): DemoTournament {
  return {
    id: newId(),
    status: 'registering',
    settings: settings(),
    createdAt: ago(2 * 60 * MINUTE),
    startedAt: null,
    endedAt: null,
    bracket: [],
    pairings: {},
    ...fields,
  };
}

/** A finished tournament: every pairing decided at random. */
function finishedTournament(name: string, players: DemoPlayer[]): DemoTournament {
  let bracket = createBracket(shuffle(players.map((p) => p.id)));
  bracket.forEach((round, r) =>
    round.forEach((_, i) => {
      if (bracket[r]![i]!.winner === null) bracket = recordWinner(bracket, r, i, Math.random() < 0.5 ? 0 : 1);
    }),
  );
  const pairings: DemoTournament['pairings'] = {};
  bracket.forEach((round, r) => round.forEach((_, i) => (pairings[`${r}:${i}`] = { id: newId(), matchId: null })));
  return tournament({
    name,
    size: 4,
    status: 'finished',
    createdBy: players[0]!.id,
    createdAt: ago(3 * DAY),
    startedAt: ago(3 * DAY - 10 * MINUTE),
    endedAt: ago(3 * DAY - 70 * MINUTE),
    players: players.map((p) => p.id),
    bracket,
    pairings,
  });
}

export function seedWorld(): DemoDb {
  const players = PLAYERS.map(makePlayer);
  const named = (...names: string[]) => names.map((name) => byName(players, name));

  return {
    version: DB_VERSION,
    players,
    viewers: {},
    matches: [],
    tournaments: [
      tournament({
        name: 'Friday Cup',
        size: 4,
        createdBy: byName(players, 'lina').id,
        players: named('lina', 'kenji').map((p) => p.id),
      }),
      // Starts on the first tick of the simulation, which creates its matches.
      tournament({
        name: 'Weekend Open',
        size: 8,
        createdBy: byName(players, 'omar_k').id,
        createdAt: ago(40 * MINUTE),
        players: named('omar_k', 'noor', 'zara', 'amara', 'yuki', 'jonas', 'ines', 'kenji').map((p) => p.id),
      }),
      finishedTournament('Rookie Cup', named('sofia', 'mateo', 'yuki', 'jonas')),
    ],
    tasks: [],
  };
}

// ---- The viewer's starting point --------------------------------------------

type Language = 'en' | 'fr' | 'ar';

export function currentLanguage(): Language {
  const lang = document.documentElement.lang;
  return lang === 'fr' || lang === 'ar' ? lang : 'en';
}

const GREETINGS: Record<Language, [string, string, string]> = {
  en: ['Hey! Want to play a game later?', 'I found a nasty trap on the 9×7 board 😄', 'Good game yesterday!'],
  fr: [
    'Salut ! Une partie plus tard ?',
    'J’ai trouvé un piège redoutable sur le plateau 9×7 😄',
    'Belle partie hier !',
  ],
  ar: ['مرحبًا! هل نلعب مباراة لاحقًا؟', 'وجدت فخًّا قويًا على اللوحة 9×7 😄', 'مباراة جميلة البارحة!'],
};

export function seedViewer(db: DemoDb): ViewerState {
  const find = (name: string) => byName(db.players, name);
  const [hello, trap, goodGame] = GREETINGS[currentLanguage()];

  const message = (peer: DemoPlayer, body: string, minutesAgo: number): DemoMessage => ({
    id: newId(),
    peerId: peer.id,
    from: 'peer',
    kind: 'text',
    body,
    matchId: null,
    tournamentId: null,
    event: null,
    createdAt: ago(minutesAgo * MINUTE),
  });

  const lina = find('lina');
  const kenji = find('kenji');
  return {
    joinedAt: new Date().toISOString(),
    friends: [
      { id: lina.id, since: ago(90 * DAY) },
      { id: kenji.id, since: ago(30 * DAY) },
      { id: find('sofia').id, since: ago(12 * DAY) },
    ],
    incoming: [find('noor').id],
    outgoing: [find('elif').id],
    blocked: [],
    messages: [message(kenji, goodGame, 26 * 60), message(lina, hello, 40), message(lina, trap, 12)],
    readByViewer: { [kenji.id]: ago(20 * 60 * MINUTE) },
    readByPeer: {},
    profile: {},
  };
}

// ---- Replies ----------------------------------------------------------------

const REPLIES: Record<Language, string[]> = {
  en: [
    'Sounds good!',
    'Haha, nice one.',
    'Give me five minutes and I’m in.',
    'I’m practicing my openings today.',
    'Rematch later?',
    'Good luck in the tournament!',
    'Center column first, always.',
    'Ok!',
  ],
  fr: [
    'Ça marche !',
    'Haha, bien vu.',
    'Donne-moi cinq minutes et j’arrive.',
    'Je travaille mes ouvertures aujourd’hui.',
    'Revanche plus tard ?',
    'Bonne chance pour le tournoi !',
    'Toujours la colonne du milieu d’abord.',
    'Ok !',
  ],
  ar: [
    'فكرة جيدة!',
    'هههه، حركة جميلة.',
    'أعطني خمس دقائق وسأنضم.',
    'أتدرّب على الافتتاحيات اليوم.',
    'مباراة ثأر لاحقًا؟',
    'حظًا موفقًا في البطولة!',
    'العمود الأوسط أولًا، دائمًا.',
    'حسنًا!',
  ],
};

const INVITE_REPLIES: Record<Language, string> = {
  en: 'On my way!',
  fr: 'J’arrive !',
  ar: 'أنا قادم!',
};

export function replyText(invite: boolean): string {
  const language = currentLanguage();
  if (invite) return INVITE_REPLIES[language];
  const replies = REPLIES[language];
  return replies[Math.floor(Math.random() * replies.length)]!;
}
