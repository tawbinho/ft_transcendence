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
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { CreateTournamentDto } from './dto/create-tournament.dto.js';
import { ListTournamentsQuery } from './dto/list-tournaments.query.js';
import { CREATE_LIMIT_PER_MINUTE } from './tournament.constants.js';
import type { TournamentView } from './tournament-view.js';
import {
  TournamentsService,
  type TournamentPage,
} from './tournaments.service.js';

// The doorway to tournaments: it declares the routes, validates the input and
// calls the service. No tournament logic here.
@UseGuards(SessionGuard)
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournaments: TournamentsService) {}

  // GET /api/tournaments: the list screen.
  @Get()
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
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTournamentDto,
  ): Promise<TournamentView> {
    return this.tournaments.create(user.id, dto);
  }

  // GET /api/tournaments/:id: the tournament page.
  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TournamentView> {
    return this.tournaments.get(user.id, id);
  }

  // DELETE /api/tournaments/:id: the creator cancels it. Answers `data: null`.
  @Delete(':id')
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
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TournamentView> {
    return this.tournaments.join(user.id, id);
  }

  // POST /api/tournaments/:id/start: the "Start now" button (creator only).
  @Post(':id/start')
  @HttpCode(200)
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TournamentView> {
    return this.tournaments.start(user.id, id);
  }

  // POST /api/tournaments/:id/leave: the "Leave" button.
  @Post(':id/leave')
  @HttpCode(200)
  leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TournamentView> {
    return this.tournaments.leave(user.id, id);
  }
}
