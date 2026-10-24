import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { BlocksService } from './blocks.service.js';
import type { UserSummaryView } from './friend-view.js';

// WHY THIS FILE EXISTS
// The doorway to blocking: routes, input checks, then the service.
@UseGuards(SessionGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocks: BlocksService) {}

  // GET /api/blocks: the players I blocked.
  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<UserSummaryView[]> {
    return this.blocks.list(user.id);
  }

  // PUT /api/blocks/:userId: block. Also ends any friendship or request.
  @Put(':userId')
  block(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.blocks.block(user.id, userId);
  }

  // DELETE /api/blocks/:userId: unblock.
  @Delete(':userId')
  unblock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.blocks.unblock(user.id, userId);
  }
}
