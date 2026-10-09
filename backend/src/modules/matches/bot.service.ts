import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service.js';
import { AiThread } from './ai/ai-thread.js';
import type { Difficulty } from './ai/ai.js';
import { replay } from './engine/game.engine.js';
import { MatchMove } from './entities/match-move.entity.js';
import { MatchPlayer } from './entities/match-player.entity.js';
import { Match } from './entities/match.entity.js';
import { MatchesService } from './matches.service.js';

// The computer opponents. They are ordinary players (so matches, history and
// stats work for them with no special case) that nobody can log in as. A human
// plays one by creating a match with `opponentDisplayName` set to its name.
export const BOT_ACCOUNTS: ReadonlyArray<{
  difficulty: Difficulty;
  displayName: string;
  email: string;
}> = [
  { difficulty: 'easy', displayName: 'AI_Easy', email: 'ai-easy@bot.local' },
  { difficulty: 'medium', displayName: 'AI_Medium', email: 'ai-medium@bot.local' },
  { difficulty: 'hard', displayName: 'AI_Hard', email: 'ai-hard@bot.local' },
];

// A human takes a moment to answer; an instant reply feels like a machine and
// is hard to follow on screen. Between these two values, at random.
const MIN_DELAY_MS = 500;
const MAX_DELAY_MS = 1200;

// WHY THIS FILE EXISTS
// It makes the computer opponents PLAY. It listens to every change of a match
// (see MatchesService.onMatchChanged) and reacts in two cases:
//  - a match reserved for a bot is waiting: the bot joins it;
//  - a match is running and it is a bot's turn: after a short delay, the AI
//    (on its worker thread) picks a column and the bot plays it through the
//    SAME makeMove a human uses, so every rule, lock, live event and tournament
//    hook applies to the bot like to anybody.
// After a server restart it looks for such matches and carries on.
@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  // userId of each bot -> its level.
  private readonly levels = new Map<string, Difficulty>();
  // Matches where a move is already planned, so a burst of events plans one.
  private readonly planned = new Set<string>();

  // How long a bot "thinks" before playing. A field so a test can shorten it.
  thinkDelayMs = (): number =>
    MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);

  constructor(
    @InjectRepository(Match) private readonly matchRows: Repository<Match>,
    @InjectRepository(MatchPlayer)
    private readonly playerRows: Repository<MatchPlayer>,
    @InjectRepository(MatchMove) private readonly moveRows: Repository<MatchMove>,
    private readonly matches: MatchesService,
    private readonly users: UsersService,
    private readonly ai: AiThread,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const account of BOT_ACCOUNTS) {
      const user = await this.users.ensureBot(account.displayName, account.email);
      this.levels.set(user.id, account.difficulty);
    }
    this.matches.onMatchChanged((matchId) => this.handle(matchId));
    void this.resume().catch((error: unknown) => {
      this.logger.warn(`Could not resume bot matches: ${String(error)}`);
    });
  }

  // Something changed in this match: does a bot have to act?
  async handle(matchId: string): Promise<void> {
    const match = await this.matchRows.findOneBy({ id: matchId });
    if (!match) return;

    if (match.status === 'waiting') {
      // Reserved for a bot: it accepts at once.
      if (match.invitedUserId && this.levels.has(match.invitedUserId)) {
        await this.matches.join(match.invitedUserId, matchId);
      }
      return;
    }
    if (match.status !== 'in_progress') return;

    // Seat 1 moves first and the seats alternate: with an even number of moves
    // played it is seat 1's turn.
    const played = await this.moveRows.countBy({ matchId });
    const seat = played % 2 === 0 ? 1 : 2;
    const players = await this.playerRows.find({ where: { matchId } });
    const mover = players.find((player) => player.seat === seat);
    if (mover && this.levels.has(mover.userId)) {
      this.plan(matchId, mover.userId);
    }
  }

  // Plans the bot's move after a human-like delay (once per match).
  private plan(matchId: string, botId: string): void {
    if (this.planned.has(matchId)) return;
    this.planned.add(matchId);
    setTimeout(() => {
      void this.play(matchId, botId)
        .catch((error: unknown) => {
          this.logger.warn(`Bot move failed in match ${matchId}: ${String(error)}`);
        })
        .finally(() => this.planned.delete(matchId));
    }, this.thinkDelayMs());
  }

  private async play(matchId: string, botId: string): Promise<void> {
    const match = await this.matchRows.findOneBy({ id: matchId });
    if (match?.status !== 'in_progress') return; // resigned or ended meanwhile
    const seat = (await this.playerRows.findOneBy({ matchId, userId: botId }))?.seat;

    const moves = await this.moveRows.find({
      where: { matchId },
      order: { ply: 'ASC' },
    });
    const state = replay(
      { cols: match.cols, rows: match.rows, winLength: match.winLength },
      moves.map((move) => move.col),
    );
    // The turn may have passed while we waited (a duplicate event).
    if (state.status !== 'playing' || state.current !== seat) return;

    const column = await this.ai.choose(state, this.levels.get(botId)!);
    await this.matches.makeMove(botId, matchId, column);
  }

  // After a restart: matches waiting for a bot to join, and running matches
  // where a bot has to move, would otherwise stay stuck.
  private async resume(): Promise<void> {
    const botIds = [...this.levels.keys()];
    const rows = await this.matchRows.query<Array<{ id: string }>>(
      `SELECT m.id
         FROM matches m
        WHERE (m.status = 'waiting' AND m.invited_user_id = ANY($1::uuid[]))
           OR (m.status = 'in_progress' AND EXISTS (
                 SELECT 1 FROM match_players p
                  WHERE p.match_id = m.id AND p.user_id = ANY($1::uuid[])))`,
      [botIds],
    );
    for (const row of rows) await this.handle(row.id);
  }
}
