import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ListUsersQuery } from './dto/list-users.query.js';
import { ONLINE_WINDOW_MS } from './presence.service.js';
import { User } from './entities/user.entity.js';
import {
  toPlayerListItem,
  type PlayerListItemView,
  type PlayerRow,
} from './user-view.js';

export interface PlayerPage {
  items: PlayerListItemView[];
  total: number;
  limit: number;
  offset: number;
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

    if (query.search) {
      // % and _ are wildcards in LIKE: escape them so "50%" searches for "50%".
      const escaped = query.search.replace(/[\\%_]/g, '\\$&');
      where.push(`u.display_name ILIKE ${param(`%${escaped}%`)} ESCAPE '\\'`);
    }
    if (query.online !== undefined) {
      // The viewer counts as online to themselves (see toPlayerListItem).
      // COALESCE: a player never seen has last_seen_at NULL, and in SQL a
      // comparison with NULL is "unknown", which NOT would keep unknown.
      const recent = `(u.id = ${param(viewerId)} OR COALESCE(u.last_seen_at > now() - ${param(ONLINE_WINDOW_MS)} * interval '1 millisecond', FALSE))`;
      where.push(query.online ? recent : `NOT ${recent}`);
    }
    if (query.friends) {
      // Friendships are not built yet, so nobody is a friend.
      where.push('FALSE');
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const total = await this.users.query<{ count: string }[]>(
      `SELECT COUNT(*) AS count FROM users u ${whereSql}`,
      params,
    );

    const rows = await this.users.query<
      {
        id: string;
        display_name: string;
        avatar_url: string | null;
        last_seen_at: Date | null;
        created_at: Date;
        wins: string;
        losses: string;
        draws: string;
      }[]
    >(
      `SELECT u.id, u.display_name, u.avatar_url, u.last_seen_at, u.created_at,
              COALESCE(s.wins, 0) AS wins,
              COALESCE(s.losses, 0) AS losses,
              COALESCE(s.draws, 0) AS draws
         FROM users u
         LEFT JOIN (
               SELECT mp.user_id,
                      COUNT(*) FILTER (WHERE mp.result = 'win')  AS wins,
                      COUNT(*) FILTER (WHERE mp.result = 'loss') AS losses,
                      COUNT(*) FILTER (WHERE mp.result = 'draw') AS draws
                 FROM match_players mp
                 JOIN matches m ON m.id = mp.match_id
                WHERE m.status = 'finished'
                GROUP BY mp.user_id
              ) s ON s.user_id = u.id
         ${whereSql}
        ORDER BY ${ORDER_BY[query.sort ?? 'name']}
        LIMIT ${param(limit)} OFFSET ${param(offset)}`,
      params,
    );

    const now = Date.now();
    return {
      // COUNT comes back from Postgres as text (bigint): turn it into numbers.
      items: rows.map((row) => {
        const player: PlayerRow = {
          id: row.id,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          lastSeenAt: row.last_seen_at,
          createdAt: row.created_at,
          wins: Number(row.wins),
          losses: Number(row.losses),
          draws: Number(row.draws),
        };
        return toPlayerListItem(player, viewerId, now);
      }),
      total: Number(total[0]?.count ?? 0),
      limit,
      offset,
    };
  }
}
