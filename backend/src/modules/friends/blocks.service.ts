import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppError } from '../../common/errors/app-error.js';
import { EVENTS } from '../realtime/realtime.constants.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { UsersService } from '../users/users.service.js';
import { Block } from './entities/block.entity.js';
import { Friendship } from './entities/friendship.entity.js';
import { orderPair } from './friends.constants.js';
import { toUserSummary, type UserSummaryView } from './friend-view.js';

// WHY THIS FILE EXISTS
// Blocking: who blocked whom. While EITHER player blocks the other, friend
// requests, messages and match invitations between them are refused with
// BLOCKED (other modules ask isBlockedBetween()).
@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block) private readonly blocks: Repository<Block>,
    private readonly users: UsersService,
    private readonly realtime: RealtimeService,
    private readonly dataSource: DataSource,
  ) {}

  // The players the viewer blocked, A to Z.
  async list(viewerId: string): Promise<UserSummaryView[]> {
    const rows = await this.blocks.find({
      where: { blockerId: viewerId },
      relations: { blocked: true },
    });
    return rows
      .map((row) => toUserSummary(row.blocked))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  // Blocks a player AND ends any friendship or request between the two, in one
  // transaction. Idempotent: blocking twice changes nothing.
  async block(viewerId: string, otherId: string): Promise<void> {
    await this.requireOther(viewerId, otherId);
    const [low, high] = orderPair(viewerId, otherId);
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(Block)
        .values({ blockerId: viewerId, blockedId: otherId })
        .orIgnore()
        .execute();
      await manager.delete(Friendship, { userLowId: low, userHighId: high });
    });
    // A block can end a friendship: both apps refetch.
    this.realtime.emitToUsers([viewerId, otherId], EVENTS.friendsUpdate, {});
  }

  // Idempotent: unblocking a player you did not block changes nothing.
  async unblock(viewerId: string, otherId: string): Promise<void> {
    await this.requireOther(viewerId, otherId);
    await this.blocks.delete({ blockerId: viewerId, blockedId: otherId });
  }

  // True when either player blocked the other.
  async isBlockedBetween(a: string, b: string): Promise<boolean> {
    return this.blocks.exists({
      where: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    });
  }

  private async requireOther(viewerId: string, otherId: string): Promise<void> {
    if (viewerId === otherId) {
      throw new AppError('VALIDATION_ERROR', 'You cannot block yourself', 400);
    }
    if (!(await this.users.findById(otherId))) {
      throw new AppError('USER_NOT_FOUND', 'No player has this id', 404);
    }
  }
}
