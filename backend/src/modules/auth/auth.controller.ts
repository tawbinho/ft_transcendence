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
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { AppError } from '../../common/errors/app-error.js';
import type { Env } from '../../config/env.validation.js';
import type { PublicUser } from '../users/public-user.js';
import {
  PENDING_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  clearPendingCookie,
  setAuthCookies,
  setPendingCookie,
} from './auth-cookies.js';
import { AuthService, type AuthResult } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { TwoFactorCodeDto } from './dto/two-factor-code.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

// What login answers. With 2FA on, `user` is null and `twoFactorRequired`
// tells the frontend to show the code form.
interface LoginResponse {
  user: PublicUser | null;
  twoFactorRequired?: true;
}

// Rate limits are per IP address. A 6-digit code has only a million
// possibilities and passwords can be guessed, so the sensitive routes allow
// only a few attempts per minute.
const strict = (limit: number) => ({ default: { limit, ttl: 60_000 } });

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
  @Throttle(strict(5))
  @ApiOperation({ summary: 'Create an account and log in' })
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    return this.respondWithSession(res, await this.auth.signup(dto));
  }

  // POST /api/auth/login: checks the password.
  //  - 2FA off: sets the session cookies and returns the user.
  //  - 2FA on: sets only the short-lived pending cookie and answers
  //    { user: null, twoFactorRequired: true }. The user must then call
  //    POST /api/auth/2fa/verify with their code.
  @Post('login')
  @Throttle(strict(10))
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.auth.login(dto);
    if ('twoFactorRequired' in result) {
      setPendingCookie(res, result.pendingToken);
      return { user: null, twoFactorRequired: true };
    }
    return this.respondWithSession(res, result);
  }

  // POST /api/auth/2fa/verify: second stage of a 2FA login. Public (the user
  // is not logged in yet): it is authenticated by the pending cookie.
  @Post('2fa/verify')
  @Throttle(strict(5))
  @HttpCode(200)
  @ApiOperation({ summary: 'Finish a 2FA login with the 6-digit code' })
  async verifyTwoFactor(
    @Body() dto: TwoFactorCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const pendingToken = req.cookies?.[PENDING_COOKIE] as string | undefined;
    if (!pendingToken) {
      throw new AppError('UNAUTHORIZED', 'Please log in with your password first', 401);
    }
    const result = await this.auth.verifyTwoFactor(pendingToken, dto.code);
    clearPendingCookie(res); // it has done its job
    return this.respondWithSession(res, result);
  }

  // POST /api/auth/2fa/setup: step 1 of turning 2FA on. Returns the QR code
  // to scan with an authenticator app. 2FA is NOT active yet.
  @Post('2fa/setup')
  @Throttle(strict(10))
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start 2FA setup, returns a QR code' })
  setupTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ qr: string; secret: string }> {
    return this.auth.setupTwoFactor(user.id);
  }

  // POST /api/auth/2fa/enable: step 2. The first valid code turns 2FA on.
  @Post('2fa/enable')
  @Throttle(strict(5))
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Turn 2FA on with a code from the app' })
  async enableTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TwoFactorCodeDto,
  ): Promise<void> {
    await this.auth.enableTwoFactor(user.id, dto.code);
  }

  // POST /api/auth/2fa/disable: needs a valid code, so a stolen session
  // cannot quietly remove the protection.
  @Post('2fa/disable')
  @Throttle(strict(5))
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Turn 2FA off (needs a valid code)' })
  async disableTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TwoFactorCodeDto,
  ): Promise<void> {
    await this.auth.disableTwoFactor(user.id, dto.code);
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
    clearPendingCookie(res);
  }

  // GET /api/auth/me: the logged-in user. The guard answers 401 for anyone
  // without a valid access cookie, so this method only runs when logged in.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'The currently logged-in user' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.auth.me(user.id);
  }

  // Shared by signup, login, 2FA verify and refresh: put the tokens in
  // cookies and return only the user in the body.
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
