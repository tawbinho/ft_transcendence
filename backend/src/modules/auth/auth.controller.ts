import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { AppError } from '../../common/errors/app-error.js';
import type { Env } from '../../config/env.validation.js';
import type { PublicUser } from '../users/public-user.js';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from './auth-cookies.js';
import { AuthService, type AuthResult } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

// WHY THIS FILE EXISTS
// The controller is only the doorway: it declares the routes, receives the
// already-validated body, calls the service, and puts the tokens in cookies.
// No business logic here. All routes below are served under /api/auth.
//
// `@Res({ passthrough: true })` gives access to the response (to set
// cookies) while still letting Nest send the returned value as usual.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // POST /api/auth/signup: creates the account AND logs the user in.
  // The frontend reads `{ user }`; the global interceptor wraps it as
  // { data: { user } }.
  @Post('signup')
  @ApiOperation({ summary: 'Create an account and log in' })
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    return this.respondWithSession(res, await this.auth.signup(dto));
  }

  // POST /api/auth/login: checks the password, sets the cookies.
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    return this.respondWithSession(res, await this.auth.login(dto));
  }

  // POST /api/auth/refresh: swaps the refresh cookie for a new pair of
  // tokens. The browser sends the refresh cookie automatically (its path is
  // /api/auth). The old refresh token stops working.
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get new tokens using the refresh cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Please log in again', 401);
    }
    return this.respondWithSession(res, await this.auth.refresh(refreshToken));
  }

  // POST /api/auth/logout: revokes the refresh token and clears the cookies.
  // Works even if nobody is logged in.
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log out' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    clearAuthCookies(res);
  }

  // GET /api/auth/me: the logged-in user. The guard answers 401 for anyone
  // without a valid access cookie, so this method only runs when logged in.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'The currently logged-in user' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.auth.me(user.id);
  }

  // Shared by signup, login and refresh: put the tokens in cookies and
  // return only the user in the body.
  private respondWithSession(
    res: Response,
    { user, tokens }: AuthResult,
  ): { user: PublicUser } {
    setAuthCookies(
      res,
      tokens,
      this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }),
    );
    return { user };
  }
}
