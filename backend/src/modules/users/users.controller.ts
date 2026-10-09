import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { ListUsersQuery } from './dto/list-users.query.js';
import { PlayerPageResponse } from './dto/user.responses.js';
import { UsersService, type PlayerPage } from './users.service.js';

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
}
