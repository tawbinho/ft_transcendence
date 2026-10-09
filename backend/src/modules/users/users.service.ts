import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { ListUsersQuery } from './dto/list-users.query.js';
import { ONLINE_WINDOW_MS } from './presence.service.js';
import { User } from './entities/user.entity.js';
import { AppError } from '../../common/errors/app-error.js';
import type { ListProfileMatchesQuery } from './dto/list-profile-matches.query.js';
import {
  type Friendship,
  toPlayerListItem,
  toProfile,
  toProfileMatch,
  type PlayerListItemView,
  type PlayerRow,
  type ProfileMatchRow,
  type ProfileMatchView,
  type ProfileView,
} from './user-view.js';

export interface PlayerPage {
  items: PlayerListItemView[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProfileMatchPage {
  items: ProfileMatchView[];
  total: number;
  limit: number;
  offset: number;
}

// Wins, losses and draws of every player who has finished matches, counted
// from `match_players` (never stored, so they cannot go out of date). Joined
// to `users u` by the search and the profile; abandoned matches do not count.
const STATS_JOIN = `
  LEFT JOIN (
        SELECT mp.user_id,
               COUNT(*) FILTER (WHERE mp.result = 'win')  AS wins,
               COUNT(*) FILTER (WHERE mp.result = 'loss') AS losses,
               COUNT(*) FILTER (WHERE mp.result = 'draw') AS draws
          FROM match_players mp
          JOIN matches m ON m.id = mp.match_id
         WHERE m.status = 'finished'
         GROUP BY mp.user_id
       ) s ON s.user_id = u.id`;

// How the viewer relates to each player: the friendship row of the pair (the
// two ids are stored smaller first, so LEAST and GREATEST find it whichever
// side sent the request). `viewer` is the SQL placeholder of the viewer's id,
// for example "$1::uuid".
const friendJoin = (viewer: string): string => `
  LEFT JOIN friendships f
         ON f.user_low_id = LEAST(u.id, ${viewer})
        AND f.user_high_id = GREATEST(u.id, ${viewer})`;

// The columns both queries select for a player.
const playerColumns = (viewer: string): string => `
  u.id, u.display_name, u.avatar_url, u.last_seen_at, u.created_at,
  COALESCE(s.wins, 0) AS wins,
  COALESCE(s.losses, 0) AS losses,
  COALESCE(s.draws, 0) AS draws,
  CASE WHEN u.id = ${viewer} THEN 'self'
       WHEN f.user_low_id IS NULL THEN 'none'
       WHEN f.status = 'accepted' THEN 'friends'
       WHEN f.requester_id = ${viewer} THEN 'request_sent'
       ELSE 'request_received' END AS friendship,
  EXISTS (SELECT 1 FROM blocks b
           WHERE b.blocker_id = ${viewer} AND b.blocked_id = u.id) AS blocked`;

// One raw row as Postgres returns it (COUNT is bigint, so it comes as text).
interface PlayerSqlRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  last_seen_at: Date | null;
  created_at: Date;
  wins: string;
  losses: string;
  draws: string;
  friendship: Friendship;
  blocked: boolean;
}

function toPlayerRow(row: PlayerSqlRow): PlayerRow {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    wins: Number(row.wins),
    losses: Number(row.losses),
    draws: Number(row.draws),
    friendship: row.friendship,
    blocked: row.blocked,
  };
}

// ORDER BY clauses, chosen from a fixed list (never built from user input).
// The id at the end makes the order stable when two players tie.
const ORDER_BY = {
  name: 'u.display_name ASC, u.id ASC',
  wins: 'wins DESC, u.display_name ASC, u.id ASC',
  newest: 'u.created_at DESC, u.id DESC',
} as const;

// WHY THIS FILE EXISTS
// The users module owns the `users` table. Other modules (auth now, ranking
// and matches later) go through this service instead of touching the table
// directly, so every user query lives in one place.
//
// `Repository<User>` is TypeORM's ready-made toolbox for one table (find,
// save, delete...). `@InjectRepository` asks Nest for it; it is available
// because UsersModule registers the User entity with `forFeature`.
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOneBy({ email });
  }

  findByDisplayName(displayName: string): Promise<User | null> {
    return this.users.findOneBy({ displayName });
  }

  // Builds the row and saves it; the database fills id and timestamps.
  create(data: {
    email: string;
    displayName: string;
    passwordHash: string;
  }): Promise<User> {
    return this.users.save(this.users.create(data));
  }

  // The Players page: search, filter, sort, paginate. The viewer is in the
  // results too. Wins, losses and draws are COUNTED here from the finished
  // matches, never stored, so they cannot go out of date.
  async search(viewerId: string, query: ListUsersQuery): Promise<PlayerPage> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    // Filters are added as "AND ..." pieces; every value goes in `params`
    // ($1, $2...) and is never pasted into the SQL text (no SQL injection).
    const params: unknown[] = [];
    const where: string[] = [];
    const param = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    // The viewer's id is the FIRST parameter: the friendship columns and the
    // filters below all refer to it.
    const viewer = `${param(viewerId)}::uuid`;

    if (query.search) {
      // % and _ are wildcards in LIKE: escape them so "50%" searches for "50%".
      const escaped = query.search.replace(/[\\%_]/g, '\\$&');
      where.push(`u.display_name ILIKE ${param(`%${escaped}%`)} ESCAPE '\\'`);
    }
    if (query.online !== undefined) {
      // The viewer counts as online to themselves (see toPlayerListItem).
      // COALESCE: a player never seen has last_seen_at NULL, and in SQL a
      // comparison with NULL is "unknown", which NOT would keep unknown.
      const recent = `(u.id = ${viewer} OR COALESCE(u.last_seen_at > now() - ${param(ONLINE_WINDOW_MS)} * interval '1 millisecond', FALSE))`;
      where.push(query.online ? recent : `NOT ${recent}`);
    }
    if (query.friends) {
      where.push("f.status = 'accepted'");
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const total = await this.users.query<{ count: string }[]>(
      `SELECT COUNT(*) AS count FROM users u ${friendJoin(viewer)} ${whereSql}`,
      params,
    );

    const rows = await this.users.query<PlayerSqlRow[]>(
      `SELECT ${playerColumns(viewer)}
         FROM users u
         ${STATS_JOIN}
         ${friendJoin(viewer)}
         ${whereSql}
        ORDER BY ${ORDER_BY[query.sort ?? 'name']}
        LIMIT ${param(limit)} OFFSET ${param(offset)}`,
      params,
    );

    const now = Date.now();
    return {
      items: rows.map((row) =>
        toPlayerListItem(toPlayerRow(row), viewerId, now),
      ),
      total: Number(total[0]?.count ?? 0),
      limit,
      offset,
    };
  }

  // One player's profile, found by their exact display name (case-sensitive).
  async getProfile(
    viewerId: string,
    displayName: string,
  ): Promise<ProfileView> {
    const rows = await this.users.query<PlayerSqlRow[]>(
      `SELECT ${playerColumns('$2::uuid')}
         FROM users u
         ${STATS_JOIN}
         ${friendJoin('$2::uuid')}
        WHERE u.display_name = $1`,
      [displayName, viewerId],
    );
    if (!rows[0]) throw this.notFound();
    return toProfile(toPlayerRow(rows[0]), viewerId);
  }

  // The finished matches of a player, newest first, each seen from that
  // player's side. Any logged-in user can read any player's history.
  async listProfileMatches(
    displayName: string,
    query: ListProfileMatchesQuery,
  ): Promise<ProfileMatchPage> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const user = await this.users.findOneBy({ displayName });
    if (!user) throw this.notFound();

    const total = await this.users.query<{ count: string }[]>(
      `SELECT COUNT(*) AS count
         FROM match_players mp
         JOIN matches m ON m.id = mp.match_id
        WHERE mp.user_id = $1 AND m.status = 'finished'`,
      [user.id],
    );

    // `mine` is the profile owner's seat in the match, `theirs` the other
    // one. Moves are counted with a subquery.
    const rows = await this.users.query<
      {
        id: string;
        result: ProfileMatchRow['result'];
        cols: number;
        rows: number;
        win_length: number;
        theme: string;
        ended_at: Date;
        move_count: string;
        opponent_id: string;
        opponent_name: string;
      }[]
    >(
      `SELECT m.id, mine.result, m.cols, m.rows, m.win_length, m.theme,
              m.ended_at,
              (SELECT COUNT(*) FROM match_moves mv WHERE mv.match_id = m.id) AS move_count,
              opp.id AS opponent_id, opp.display_name AS opponent_name
         FROM match_players mine
         JOIN matches m ON m.id = mine.match_id
         JOIN match_players theirs
              ON theirs.match_id = m.id AND theirs.user_id <> mine.user_id
         JOIN users opp ON opp.id = theirs.user_id
        WHERE mine.user_id = $1 AND m.status = 'finished'
        ORDER BY m.ended_at DESC, m.id DESC
        LIMIT $2 OFFSET $3`,
      [user.id, limit, offset],
    );

    return {
      items: rows.map((row) =>
        toProfileMatch({
          id: row.id,
          result: row.result,
          cols: row.cols,
          rows: row.rows,
          winLength: row.win_length,
          theme: row.theme,
          endedAt: row.ended_at,
          moveCount: Number(row.move_count),
          opponent: { id: row.opponent_id, displayName: row.opponent_name },
        }),
      ),
      total: Number(total[0]?.count ?? 0),
      limit,
      offset,
    };
  }

  // Changes the display name. Same rules as signup (the DTO checked them).
  // Names are unique and case-sensitive, like at signup.
  async rename(userId: string, displayName: string): Promise<User> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw this.notFound();
    // Choosing the name you already have changes nothing.
    if (user.displayName === displayName) return user;

    if (await this.users.existsBy({ displayName })) throw this.nameTaken();
    try {
      await this.users.update({ id: userId }, { displayName });
    } catch (error) {
      // Two people choosing the same name at the same moment: the database
      // unique rule (23505) refuses the second one.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw this.nameTaken();
      }
      throw error;
    }
    user.displayName = displayName;
    return user;
  }

  // Used by the avatar service. null: back to the default avatar.
  async setAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
    await this.users.update({ id: userId }, { avatarUrl });
  }

  private nameTaken(): AppError {
    return new AppError(
      'DISPLAY_NAME_TAKEN',
      'This display name is already taken',
      409,
    );
  }

  private notFound(): AppError {
    return new AppError('USER_NOT_FOUND', 'No player has this name', 404);
  }
}
