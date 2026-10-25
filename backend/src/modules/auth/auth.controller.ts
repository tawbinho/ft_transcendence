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
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { AppError } from '../../common/errors/app-error.js';
import type { PublicUser } from '../users/public-user.js';
import {
  SESSION_COOKIE,
  clearSessionCookie,
  setSessionCookie,
} from './auth-cookies.js';
import { AuthService, type AuthResult } from './auth.service.js';
import { LoginResponse } from './dto/auth.responses.js';
import { LoginDto } from './dto/login.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ResendVerificationDto, VerifyEmailDto } from './dto/verify-email.dto.js';
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

// The controller is only the doorway: it declares the routes, receives the
// already-validated body, calls the service, and puts the session in the
// cookie. No business logic here.
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // POST /api/auth/signup: creates the account and emails a 6-digit
  // code. It does NOT log in: login works only after the email is verified.
  @Post('signup')
  @Throttle(strict(5))
  async signup(@Body() dto: SignupDto): Promise<{ verificationSent: true }> {
    await this.auth.signup(dto);
    return { verificationSent: true };
  }

  // POST /api/auth/login: checks the password.
  //  - 2FA off: sets the session cookie and returns the user.
  //  - 2FA on: sets a short-lived PENDING session cookie and answers
  //    { user: null, twoFactorRequired: true }. The user must then call
  //    POST /api/auth/2fa/verify with their code.
  @Post('login')
  @Throttle(strict(10))
  @HttpCode(200)
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
  // one route.
  @Post('2fa/verify')
  @Throttle(strict(5))
  @HttpCode(200)
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

  // POST /api/auth/2fa/code: emails a 6-digit code. It is the first step of
  // turning 2FA on, and the proof needed to turn it off.
  @Post('2fa/code')
  @Throttle(strict(5))
  @HttpCode(200)
  @UseGuards(SessionGuard)
  sendTwoFactorCode(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.auth.sendTwoFactorCode(user.id);
  }

  // POST /api/auth/2fa/enable: step 2. The emailed code turns 2FA on.
  @Post('2fa/enable')
  @Throttle(strict(5))
  @HttpCode(200)
  @UseGuards(SessionGuard)
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
  async disableTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TwoFactorOrBackupCodeDto,
  ): Promise<void> {
    await this.auth.disableTwoFactor(user.id, dto.code);
  }

  // POST /api/auth/2fa/backup-codes: a NEW list of 10 backup codes; the old
  // ones stop working. Needs a valid code, so a stolen session cannot reset
  // them.
  @Post('2fa/backup-codes')
  @Throttle(strict(5))
  @HttpCode(200)
  @UseGuards(SessionGuard)
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
  async backupCodesRemaining(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ remaining: number }> {
    return { remaining: await this.auth.backupCodesRemaining(user.id) };
  }

  // POST /api/auth/verify-email: the 6-digit code from the email.
  @Post('verify-email')
  @Throttle(strict(10))
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.auth.verifyEmail(dto.email, dto.code);
  }

  // POST /api/auth/resend-verification: a new code. Always answers 200.
  @Post('resend-verification')
  @Throttle(strict(3))
  @HttpCode(200)
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<void> {
    await this.auth.resendVerification(dto.email);
  }

  // POST /api/auth/forgot-password: emails a reset code. Always answers 200.
  @Post('forgot-password')
  @Throttle(strict(3))
  @HttpCode(200)
  async forgotPassword(@Body() dto: ResendVerificationDto): Promise<void> {
    await this.auth.forgotPassword(dto.email);
  }

  // POST /api/auth/reset-password: the code + a new password. Ends every login.
  @Post('reset-password')
  @Throttle(strict(10))
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.email, dto.code, dto.password);
  }

  // POST /api/auth/logout: ends the login immediately (the session row is
  // deleted) and clears the cookie. Works even if nobody is logged in.
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.logout(req.cookies?.[SESSION_COOKIE] as string | undefined);
    clearSessionCookie(res);
  }

  // GET /api/auth/me: the logged-in user, or null when nobody is logged in.
  @Get('me')
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
