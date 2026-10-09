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
import {
  FriendsOverviewResponse,
  FriendshipResultResponse,
} from './dto/friend.responses.js';
import type { FriendsOverviewView } from './friend-view.js';
import { FriendsService, type FriendshipAnswer } from './friends.service.js';

// WHY THIS FILE EXISTS
// The doorway to friendships: routes, input checks, then the service. Every
// route needs a logged-in user.
@ApiTags('friends')
@ApiCookieAuth('session')
@UseGuards(SessionGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  // GET /api/friends: the Friends page.
  @Get()
  @ApiOperation({ summary: 'Friends and friend requests' })
  @ApiOkResponse({ type: FriendsOverviewResponse })
  overview(@CurrentUser() user: AuthenticatedUser): Promise<FriendsOverviewView> {
    return this.friends.overview(user.id);
  }

  // PUT /api/friends/:userId: "Add friend" / "Accept". PUT because repeating it
  // changes nothing more.
  @Put(':userId')
  @ApiOperation({
    summary: 'Send or accept a friend request',
    description:
      'Errors: CANNOT_FRIEND_SELF (400), BLOCKED (403), USER_NOT_FOUND (404).',
  })
  @ApiOkResponse({ type: FriendshipResultResponse })
  async add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ friendship: FriendshipAnswer }> {
    return { friendship: await this.friends.add(user.id, userId) };
  }

  // DELETE /api/friends/:userId: "Remove", "Cancel request" or "Decline".
  @Delete(':userId')
  @ApiOperation({
    summary: 'Remove a friend, cancel or decline a request',
    description: 'Always answers `friendship: none`. Errors: CANNOT_FRIEND_SELF, USER_NOT_FOUND.',
  })
  @ApiOkResponse({ type: FriendshipResultResponse })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ friendship: FriendshipAnswer }> {
    return { friendship: await this.friends.remove(user.id, userId) };
  }
}
