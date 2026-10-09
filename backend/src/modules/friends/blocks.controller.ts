import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { BlocksService } from './blocks.service.js';
import { UserSummaryResponse } from './dto/friend.responses.js';
import type { UserSummaryView } from './friend-view.js';

// WHY THIS FILE EXISTS
// The doorway to blocking: routes, input checks, then the service.
@ApiTags('chat')
@ApiCookieAuth('session')
@UseGuards(SessionGuard)
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocks: BlocksService) {}

  // GET /api/blocks: the players I blocked.
  @Get()
  @ApiOperation({ summary: 'The players I blocked' })
  @ApiOkResponse({ type: [UserSummaryResponse] })
  list(@CurrentUser() user: AuthenticatedUser): Promise<UserSummaryView[]> {
    return this.blocks.list(user.id);
  }

  // PUT /api/blocks/:userId: block. Also ends any friendship or request.
  @Put(':userId')
  @ApiOperation({
    summary: 'Block a player',
    description: 'Also ends any friendship or friend request between the two. Idempotent. `data` is null.',
  })
  @ApiOkResponse({ description: 'Blocked. `data` is null.' })
  block(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.blocks.block(user.id, userId);
  }

  // DELETE /api/blocks/:userId: unblock.
  @Delete(':userId')
  @ApiOperation({ summary: 'Unblock a player', description: 'Idempotent. `data` is null.' })
  @ApiOkResponse({ description: 'Unblocked. `data` is null.' })
  unblock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.blocks.unblock(user.id, userId);
  }
}
