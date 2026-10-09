import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { ListProfileMatchesQuery } from './dto/list-profile-matches.query.js';
import { ListUsersQuery } from './dto/list-users.query.js';
import {
  PlayerPageResponse,
  ProfileMatchPageResponse,
  ProfileResponse,
} from './dto/user.responses.js';
import type { ProfileView } from './user-view.js';
import {
  UsersService,
  type PlayerPage,
  type ProfileMatchPage,
} from './users.service.js';

// WHY THIS FILE EXISTS
// The doorway to the players: it declares the routes, validates the input and
// calls the service. No logic here. Every route needs a logged-in user.
@ApiTags('users')
@ApiCookieAuth('session')
@UseGuards(SessionGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // GET /api/users: the Players page.
  @Get()
  @ApiOperation({
    summary: 'Search players',
    description:
      'Filter with `search`, `online`, `friends`; order with `sort`; paginate with `limit` and `offset`. The viewer is in the results too (`friendship: self`).',
  })
  @ApiOkResponse({ type: PlayerPageResponse })
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListUsersQuery,
  ): Promise<PlayerPage> {
    return this.users.search(user.id, query);
  }

  // GET /api/users/:displayName: the profile page. The name must match
  // exactly, as stored.
  @Get(':displayName')
  @ApiOperation({
    summary: "A player's profile",
    description:
      'The display name must match exactly (case-sensitive). Error: USER_NOT_FOUND.',
  })
  @ApiOkResponse({ type: ProfileResponse })
  profile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('displayName') displayName: string,
  ): Promise<ProfileView> {
    return this.users.getProfile(user.id, displayName);
  }

  // GET /api/users/:displayName/matches: the history tab of the profile.
  @Get(':displayName/matches')
  @ApiOperation({
    summary: "A player's finished matches",
    description:
      'Newest first. Any logged-in user can read any history. Error: USER_NOT_FOUND.',
  })
  @ApiOkResponse({ type: ProfileMatchPageResponse })
  profileMatches(
    @Param('displayName') displayName: string,
    @Query() query: ListProfileMatchesQuery,
  ): Promise<ProfileMatchPage> {
    return this.users.listProfileMatches(displayName, query);
  }
}
