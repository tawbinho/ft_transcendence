import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { PublicUser } from '../users/public-user.js';
import { AuthService } from './auth.service.js';
import { SignupDto } from './dto/signup.dto.js';

// WHY THIS FILE EXISTS
// The controller is only the doorway: it declares the routes, receives the
// already-validated body, calls the service and returns the result. No
// business logic here. All routes below are served under /api/auth.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // POST /api/auth/signup
  // `@Body() dto: SignupDto`: the ValidationPipe checks the JSON body against
  // SignupDto's rules before this method runs.
  // The frontend (AuthContext / Signup page) reads `{ user }`. The global
  // interceptor wraps it again as { data: { user } }.
  @Post('signup')
  @ApiOperation({ summary: 'Create an account' })
  async signup(@Body() dto: SignupDto): Promise<{ user: PublicUser }> {
    return { user: await this.auth.signup(dto) };
  }
}
