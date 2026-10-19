import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { Throttle } from '@nestjs/throttler';
import { AvatarUploadFilter } from './avatar-upload.filter.js';
import { AvatarService, type UploadedImage } from './avatar.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { PublicUserResponse } from './dto/public-user.response.js';
import { toPublicUser, type PublicUser } from './public-user.js';
import {
  AVATAR_MAX_BYTES,
  PROFILE_WRITE_LIMIT_PER_MINUTE,
} from './user.constants.js';
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
@UseGuards(SessionGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly avatars: AvatarService,
  ) {}

  // PATCH /api/users/me: change my display name. Declared BEFORE the
  // `:displayName` routes so "me" is never read as a name.
  @Patch('me')
  @Throttle({
    default: { limit: PROFILE_WRITE_LIMIT_PER_MINUTE, ttl: 60_000 },
  })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    return toPublicUser(await this.users.rename(user.id, dto.displayName));
  }

  // PUT /api/users/me/avatar: upload my picture, as a form file named
  // "avatar". The upload library keeps the file in memory and refuses
  // anything over the size limit.
  @Put('me/avatar')
  @Throttle({
    default: { limit: PROFILE_WRITE_LIMIT_PER_MINUTE, ttl: 60_000 },
  })
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: AVATAR_MAX_BYTES, files: 1 },
    }),
  )
  @UseFilters(AvatarUploadFilter)
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedImage | undefined,
  ): Promise<PublicUser> {
    return toPublicUser(await this.avatars.set(user.id, file));
  }

  // DELETE /api/users/me/avatar: back to the default avatar.
  @Delete('me/avatar')
  async removeAvatar(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PublicUser> {
    return toPublicUser(await this.avatars.remove(user.id));
  }

  // GET /api/users: the Players page.
  @Get()
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListUsersQuery,
  ): Promise<PlayerPage> {
    return this.users.search(user.id, query);
  }

  // GET /api/users/:displayName: the profile page. The name must match
  // exactly, as stored.
  @Get(':displayName')
  profile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('displayName') displayName: string,
  ): Promise<ProfileView> {
    return this.users.getProfile(user.id, displayName);
  }

  // GET /api/users/:displayName/matches: the history tab of the profile.
  @Get(':displayName/matches')
  profileMatches(
    @Param('displayName') displayName: string,
    @Query() query: ListProfileMatchesQuery,
  ): Promise<ProfileMatchPage> {
    return this.users.listProfileMatches(displayName, query);
  }
}
