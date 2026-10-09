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
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { AppError } from '../../common/errors/app-error.js';
import { PublicUserResponse } from '../users/dto/public-user.response.js';
import type { PublicUser } from '../users/public-user.js';
import {
  SESSION_COOKIE,
  clearSessionCookie,
  setSessionCookie,
} from './auth-cookies.js';
import { AuthService, type AuthResult } from './auth.service.js';
import {
  LoginResponse,
  SessionResponse,
  BackupCodesRemainingResponse,
  BackupCodesResponse,
  TwoFactorSetupResponse,
} from './dto/auth.responses.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import {
  TwoFactorCodeDto,
  TwoFactorOrBackupCodeDto,
} from './dto/two-factor-code.dto.js';
import { SessionGuard } from './session.guard.js';

// Rate limits are per IP address. A 6-digit code has only a million
// possibilities and passwords can be guessed, so the sensitive routes allow
// only a few attempts per minute.
const strict = (limit: number) => ({ default: { limit, ttl: 60_000 } });

// WHY THIS FILE EXISTS
// The controller is only the doorway: it declares the routes, receives the
// already-validated body, calls the service, and puts the session in the
// cookie. No business logic here. All routes are served under /api/auth.
//
// `@Res({ passthrough: true })` gives access to the response (to set
// cookies) while still letting Nest send the returned value as usual.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // POST /api/auth/signup: creates the account AND logs the user in.
  // The global interceptor wraps the answer as { data: { user } }.
  @Post('signup')
  @Throttle(strict(5))
  @ApiOperation({ summary: 'Create an account and log in' })
  @ApiCreatedResponse({
    type: SessionResponse,
    description: 'Account created. Sets the `session` cookie.',
  })
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    return this.respondWithSession(res, await this.auth.signup(dto));
  }

  // POST /api/auth/login: checks the password.
  //  - 2FA off: sets the session cookie and returns the user.
  //  - 2FA on: sets a short-lived PENDING session cookie and answers
  //    { user: null, twoFactorRequired: true }. The user must then call
  //    POST /api/auth/2fa/verify with their code.
  @Post('login')
  @Throttle(strict(10))
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({
    type: LoginResponse,
    description:
      'Logged in (`session` cookie set), or twoFactorRequired when a 2FA code is still needed (the cookie then only works for /auth/2fa/verify, for 5 minutes).',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.auth.login(dto);
    if ('twoFactorRequired' in result) {
      setSessionCookie(res, result.session);
      return { user: null, twoFactorRequired: true };
    }
    return this.respondWithSession(res, result);
  }

  // POST /api/auth/2fa/verify: second stage of a 2FA login. The user is not
  // fully logged in yet: the pending session in the cookie authenticates this
  // one route. On success the cookie is replaced by a brand-new real session.
  @Post('2fa/verify')
  @Throttle(strict(5))
  @HttpCode(200)
  @ApiOperation({
    summary: 'Finish a 2FA login with the 6-digit code or a backup code',
  })
  @ApiOkResponse({
    type: SessionResponse,
    description: 'Logged in. The `session` cookie is replaced by a full session.',
  })
  async verifyTwoFactor(
    @Body() dto: TwoFactorOrBackupCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const pendingToken = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!pendingToken) {
      throw new AppError('UNAUTHORIZED', 'Please log in with your password first', 401);
    }
    return this.respondWithSession(
      res,
      await this.auth.verifyTwoFactor(pendingToken, dto.code),
    );
  }

  // POST /api/auth/2fa/setup: step 1 of turning 2FA on. Returns the QR code
  // to scan with an authenticator app. 2FA is NOT active yet.
  @Post('2fa/setup')
  @Throttle(strict(10))
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Start 2FA setup, returns a QR code' })
  @ApiCookieAuth('session')
  @ApiOkResponse({ type: TwoFactorSetupResponse })
  setupTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ qr: string; secret: string }> {
    return this.auth.setupTwoFactor(user.id);
  }

  // POST /api/auth/2fa/enable: step 2. The first valid code turns 2FA on.
  @Post('2fa/enable')
  @Throttle(strict(5))
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @ApiOperation({ summary: 'Turn 2FA on with a code from the app' })
  @ApiCookieAuth('session')
  @ApiOkResponse({
    type: BackupCodesResponse,
    description:
      '2FA is now on. The 10 backup codes are returned, ONCE: keep them safe.',
  })
  async enableTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TwoFactorCodeDto,
  ): Promise<{ backupCodes: string[] }> {
    return { backupCodes: await this.auth.enableTwoFactor(user.id, dto.code) };
  }

  // POST /api/auth/2fa/disable: needs a valid code, so a stolen session
  // cannot quietly remove the protection.
  @Post('2fa/disable')
  @Throttle(strict(5))
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @ApiOperation({
    summary: 'Turn 2FA off (needs a valid code or a backup code)',
  })
  @ApiCookieAuth('session')
  @ApiOkResponse({ description: '2FA is now off. `data` is null.' })
  async disableTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TwoFactorOrBackupCodeDto,
  ): Promise<void> {
    await this.auth.disableTwoFactor(user.id, dto.code);
  }

  // POST /api/auth/2fa/backup-codes: a NEW list of 10 backup codes; the old
  // ones stop working. Needs a valid code, so a stolen session cannot reset them.
  @Post('2fa/backup-codes')
  @Throttle(strict(5))
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @ApiOperation({
    summary: 'Make new backup codes (the old ones stop working)',
    description:
      'Needs a valid code (app or backup). Errors: INVALID_2FA_CODE, TWO_FACTOR_NOT_ENABLED.',
  })
  @ApiCookieAuth('session')
  @ApiOkResponse({ type: BackupCodesResponse })
  async regenerateBackupCodes(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TwoFactorOrBackupCodeDto,
  ): Promise<{ backupCodes: string[] }> {
    return {
      backupCodes: await this.auth.regenerateBackupCodes(user.id, dto.code),
    };
  }

  // GET /api/auth/2fa/backup-codes: how many are left (never the codes).
  @Get('2fa/backup-codes')
  @UseGuards(SessionGuard)
  @ApiOperation({
    summary: 'How many backup codes are left',
    description: 'Error: TWO_FACTOR_NOT_ENABLED.',
  })
  @ApiCookieAuth('session')
  @ApiOkResponse({ type: BackupCodesRemainingResponse })
  async backupCodesRemaining(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ remaining: number }> {
    return { remaining: await this.auth.backupCodesRemaining(user.id) };
  }

  // POST /api/auth/logout: ends the login immediately (the session row is
  // deleted) and clears the cookie. Works even if nobody is logged in.
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log out' })
  @ApiOkResponse({ description: 'Session ended, cookie cleared. `data` is null.' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(req.cookies?.[SESSION_COOKIE] as string | undefined);
    clearSessionCookie(res);
  }

  // GET /api/auth/me: the logged-in user, or null when nobody is logged in.
  // Deliberately NOT behind the guard: "am I logged in?" is a question whose
  // answer can be "no" without being an error (see AuthService.currentUser).
  @Get('me')
  @ApiOperation({ summary: 'The logged-in user, or null if not logged in' })
  @ApiOkResponse({
    type: PublicUserResponse,
    description: 'The user, or `data: null` when not logged in.',
  })
  me(@Req() req: Request): Promise<PublicUser | null> {
    return this.auth.currentUser(req.cookies?.[SESSION_COOKIE] as string | undefined);
  }

  // Shared by signup, login and 2FA verify: put the session in the cookie and
  // return only the user in the body.
  private respondWithSession(
    res: Response,
    { user, session }: AuthResult,
  ): { user: PublicUser } {
    setSessionCookie(res, session);
    return { user };
  }
}
