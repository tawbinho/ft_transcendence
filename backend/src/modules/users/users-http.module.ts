import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AvatarsController } from './avatars.controller.js';
import { UsersController } from './users.controller.js';
import { UsersModule } from './users.module.js';

// The HTTP side of the users: the /users routes.
// It is a separate module from UsersModule on purpose. AuthModule imports
// UsersModule (to create accounts), and these routes need AuthModule's guard:
// putting the controller in UsersModule itself would make the two modules
// import each other in a circle.
@Module({
  imports: [UsersModule, AuthModule],
  controllers: [UsersController, AvatarsController],
})
export class UsersHttpModule {}
