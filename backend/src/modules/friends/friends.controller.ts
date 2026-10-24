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
import type { FriendsOverviewView } from './friend-view.js';
import { FriendsService, type FriendshipAnswer } from './friends.service.js';

// The doorway to friendships: routes, input checks, then the service. Every
// route needs a logged-in user.
@UseGuards(SessionGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  // GET /api/friends: the Friends page.
  @Get()
  overview(@CurrentUser() user: AuthenticatedUser): Promise<FriendsOverviewView> {
    return this.friends.overview(user.id);
  }

  // PUT /api/friends/:userId: "Add friend" / "Accept". PUT because repeating it
  // changes nothing more.
  @Put(':userId')
  async add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ friendship: FriendshipAnswer }> {
    return { friendship: await this.friends.add(user.id, userId) };
  }

  // DELETE /api/friends/:userId: "Remove", "Cancel request" or "Decline".
  @Delete(':userId')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ friendship: FriendshipAnswer }> {
    return { friendship: await this.friends.remove(user.id, userId) };
  }
}
