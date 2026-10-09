import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { EVENTS } from '../realtime/realtime.constants.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { UsersService } from '../users/users.service.js';
import { BlocksService } from './blocks.service.js';
import { Friendship } from './entities/friendship.entity.js';
import { orderPair } from './friends.constants.js';
import {
  toFriendsOverview,
  type FriendsOverviewView,
} from './friend-view.js';

// What PUT and DELETE answer: how the viewer relates to the other player now.
export type FriendshipAnswer = 'none' | 'friends' | 'request_sent';

// WHY THIS FILE EXISTS
// The rules of friendships: who may ask whom, accepting, declining, removing.
// There is ONE row per pair of players (see the entity), so the two directions
// of a request meet in the same row.
@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendships: Repository<Friendship>,
    private readonly users: UsersService,
    private readonly blocks: BlocksService,
    private readonly realtime: RealtimeService,
    private readonly dataSource: DataSource,
  ) {}

  // Friends and both kinds of pending requests of the viewer.
  async overview(viewerId: string): Promise<FriendsOverviewView> {
    const rows = await this.friendships.find({
      where: [{ userLowId: viewerId }, { userHighId: viewerId }],
      relations: { userLow: true, userHigh: true },
    });
    return toFriendsOverview(
      rows.map((row) => ({
        other: row.userLowId === viewerId ? row.userHigh : row.userLow,
        status: row.status,
        requestedByViewer: row.requesterId === viewerId,
        acceptedAt: row.acceptedAt,
        createdAt: row.createdAt,
      })),
    );
  }

  // Sends a friend request, or accepts the one the other player already sent.
  // Idempotent: to a friend, or to someone who already has my request, it
  // changes nothing and answers the current state.
  async add(viewerId: string, otherId: string): Promise<FriendshipAnswer> {
    await this.requireOther(viewerId, otherId);
    if (await this.blocks.isBlockedBetween(viewerId, otherId)) {
      throw new AppError('BLOCKED', 'You cannot become friends with this player', 403);
    }

    const [low, high] = orderPair(viewerId, otherId);
    const answer = await this.dataSource.transaction(async (manager) => {
      // Create the request if the pair has no row yet. If two players ask each
      // other at the same moment, the primary key lets only ONE insert win, and
      // the other one just goes on to the lock below.
      await manager
        .createQueryBuilder()
        .insert()
        .into(Friendship)
        .values({
          userLowId: low,
          userHighId: high,
          requesterId: viewerId,
          status: 'pending',
        })
        .orIgnore()
        .execute();

      // Lock the row, then decide from what is really there.
      const row = await manager.findOneOrFail(Friendship, {
        where: { userLowId: low, userHighId: high },
        lock: { mode: 'pessimistic_write' },
      });
      if (row.status === 'accepted') return 'friends';
      if (row.requesterId === viewerId) return 'request_sent';

      // The other player asked first: answering "yes" accepts.
      await manager.update(
        Friendship,
        { userLowId: low, userHighId: high },
        { status: 'accepted', acceptedAt: new Date() },
      );
      return 'friends';
    });
    this.notifyBoth(viewerId, otherId);
    return answer;
  }

  // Removes a friend, cancels my request, or declines theirs: all delete the
  // row. Idempotent: with nothing to remove it still answers `none`.
  async remove(viewerId: string, otherId: string): Promise<FriendshipAnswer> {
    await this.requireOther(viewerId, otherId);
    const [low, high] = orderPair(viewerId, otherId);
    await this.friendships.delete({ userLowId: low, userHighId: high });
    this.notifyBoth(viewerId, otherId);
    return 'none';
  }

  // Both players' apps refetch their friends (a request arrived, was accepted,
  // was withdrawn...).
  private notifyBoth(a: string, b: string): void {
    this.realtime.emitToUsers([a, b], EVENTS.friendsUpdate, {});
  }

  private async requireOther(viewerId: string, otherId: string): Promise<void> {
    if (viewerId === otherId) {
      throw new AppError('CANNOT_FRIEND_SELF', 'You cannot be your own friend', 400);
    }
    if (!(await this.users.findById(otherId))) {
      throw new AppError('USER_NOT_FOUND', 'No player has this id', 404);
    }
  }
}
