import {
  Body,
  Controller,
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
import { CreateMatchDto } from './dto/create-match.dto.js';
import { ListLiveMatchesQuery } from './dto/list-live-matches.query.js';
import { ListMatchesQuery } from './dto/list-matches.query.js';
import { MakeMoveDto } from './dto/make-move.dto.js';
import { MatchPageResponse, MatchResponse } from './dto/match.responses.js';
import type { MatchView } from './match-view.js';
import { MatchesService, type MatchPage } from './matches.service.js';

// WHY THIS FILE EXISTS
// The doorway to matches: it declares the routes, validates the input and
// calls the service. No game logic here. Every route needs a logged-in user
// (the guard on the whole class), and all routes are under /api/matches.
@ApiTags('matches')
@ApiCookieAuth('session')
@UseGuards(SessionGuard)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  // POST /api/matches: creates a match and puts the caller in it.
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Create a match',
    description:
      'Open to anyone who has its id, or reserved for one player with `opponentDisplayName`. The creator gets seat 1 or 2 at random. The match waits until a second player joins.',
  })
  @ApiCreatedResponse({ type: MatchResponse })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMatchDto,
  ): Promise<MatchView> {
    return this.matches.create(user.id, dto);
  }

  // GET /api/matches/mine: the caller's matches. Declared BEFORE ':id',
  // otherwise "mine" would be taken for a match id.
  @Get('mine')
  @ApiOperation({
    summary: 'My matches (history)',
    description:
      'Newest first. Filter with `status`, paginate with `limit` and `offset`.',
  })
  @ApiOkResponse({ type: MatchPageResponse })
  mine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMatchesQuery,
  ): Promise<MatchPage> {
    return this.matches.listMine(user.id, query);
  }

  // GET /api/matches/live: the Watch page. Declared BEFORE ':id' too, for the
  // same reason as 'mine'.
  @Get('live')
  @ApiOperation({
    summary: 'Matches being played now',
    description:
      'Every in-progress match, most recently started first. Any logged-in user can list them; `yourSeat` is null in the matches the viewer does not play. Open one with `GET /matches/:id`.',
  })
  @ApiOkResponse({ type: MatchPageResponse })
  live(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListLiveMatchesQuery,
  ): Promise<MatchPage> {
    return this.matches.listLive(user.id, query);
  }

  // GET /api/matches/:id: the full state. Any logged-in user may read it
  // (spectator mode); `yourSeat` is null for someone who does not play it.
  @Get(':id')
  @ApiOperation({
    summary: 'The state of one match',
    description:
      'Any logged-in user can read any match (spectator mode). `yourSeat` is null for someone who does not play it.',
  })
  @ApiOkResponse({ type: MatchResponse })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchView> {
    return this.matches.get(user.id, id);
  }

  // POST /api/matches/:id/join: the second player joins and the match starts.
  @Post(':id/join')
  @HttpCode(200)
  @ApiOperation({ summary: 'Join a waiting match' })
  @ApiOkResponse({ type: MatchResponse })
  join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchView> {
    return this.matches.join(user.id, id);
  }

  // POST /api/matches/:id/moves: drop a disc. The engine judges the move.
  @Post(':id/moves')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Play a move',
    description:
      'Errors: NOT_YOUR_TURN, COLUMN_FULL, INVALID_COLUMN, MATCH_NOT_ACTIVE. The answer is the whole updated match.',
  })
  @ApiOkResponse({ type: MatchResponse })
  move(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MakeMoveDto,
  ): Promise<MatchView> {
    return this.matches.makeMove(user.id, id, dto.col);
  }

  // POST /api/matches/:id/resign: give up (or cancel a match still waiting).
  @Post(':id/resign')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Resign',
    description:
      'In a running match the opponent wins. A match still waiting for an opponent is cancelled (`abandoned`).',
  })
  @ApiOkResponse({ type: MatchResponse })
  resign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchView> {
    return this.matches.resign(user.id, id);
  }
}
