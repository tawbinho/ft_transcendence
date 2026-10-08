import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { CreateTournamentDto } from './dto/create-tournament.dto.js';
import { ListTournamentsQuery } from './dto/list-tournaments.query.js';
import {
  TournamentPageResponse,
  TournamentResponse,
} from './dto/tournament.responses.js';
import { CREATE_LIMIT_PER_MINUTE } from './tournament.constants.js';
import type { TournamentView } from './tournament-view.js';
import {
  TournamentsService,
  type TournamentPage,
} from './tournaments.service.js';

// WHY THIS FILE EXISTS
// The doorway to tournaments: it declares the routes, validates the input and
// calls the service. No tournament logic here. Every route needs a logged-in
// user (the guard on the whole class), and all routes are under /api/tournaments.
@ApiTags('tournaments')
@ApiCookieAuth('session')
@UseGuards(SessionGuard)
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournaments: TournamentsService) {}

  // GET /api/tournaments: the list screen.
  @Get()
  @ApiOperation({
    summary: 'List tournaments',
    description:
      'Newest first. Filter with `status`, paginate with `limit` and `offset`.',
  })
  @ApiOkResponse({ type: TournamentPageResponse })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTournamentsQuery,
  ): Promise<TournamentPage> {
    return this.tournaments.list(user.id, query);
  }

  // POST /api/tournaments: the "new tournament" form. The creator is
  // registered at once.
  @Post()
  @Throttle({ default: { limit: CREATE_LIMIT_PER_MINUTE, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Create a tournament',
    description:
      'A single-elimination tournament with 4 or 8 places. The creator takes the first place.',
  })
  @ApiCreatedResponse({ type: TournamentResponse })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTournamentDto,
  ): Promise<TournamentView> {
    return this.tournaments.create(user.id, dto);
  }

  // GET /api/tournaments/:id: the tournament page.
  @Get(':id')
  @ApiOperation({ summary: 'One tournament, with its registered players' })
  @ApiOkResponse({ type: TournamentResponse })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TournamentView> {
    return this.tournaments.get(user.id, id);
  }

  // DELETE /api/tournaments/:id: the creator cancels it. Answers `data: null`.
  @Delete(':id')
  @ApiOperation({
    summary: 'Cancel a tournament',
    description:
      'Creator only, while registration is open. Deletes the tournament.',
  })
  @ApiOkResponse({ description: 'Cancelled. `data` is null.' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tournaments.cancel(user.id, id);
  }

  // POST /api/tournaments/:id/join: the "Join" button. No body: the user is
  // known from the session and the tournament from the URL.
  @Post(':id/join')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Register',
    description:
      'Errors: ALREADY_JOINED, TOURNAMENT_FULL, TOURNAMENT_NOT_OPEN (registration is over).',
  })
  @ApiOkResponse({ type: TournamentResponse })
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TournamentView> {
    return this.tournaments.join(user.id, id);
  }

  // POST /api/tournaments/:id/leave: the "Leave" button.
  @Post(':id/leave')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Leave a tournament',
    description:
      'Errors: NOT_JOINED, CREATOR_CANNOT_LEAVE (the creator cancels instead), TOURNAMENT_NOT_OPEN.',
  })
  @ApiOkResponse({ type: TournamentResponse })
  leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TournamentView> {
    return this.tournaments.leave(user.id, id);
  }
}
