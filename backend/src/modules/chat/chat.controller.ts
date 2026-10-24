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
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { SEND_LIMIT_PER_MINUTE } from './chat.constants.js';
import { ChatService } from './chat.service.js';
import { ListMessagesQuery } from './dto/list-messages.query.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import type {
  ConversationView,
  MessagePageView,
  MessageView,
} from './message-view.js';

// The doorway to the chat: routes, input checks, then the service. Every route
// needs a logged-in user, and `:userId` is always the OTHER player.
@UseGuards(SessionGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  // GET /api/chat/conversations: the Messages page list.
  @Get('conversations')
  conversations(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConversationView[]> {
    return this.chat.conversations(user.id);
  }

  // GET /api/chat/:userId/messages: one conversation, newest page first.
  @Get(':userId/messages')
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ListMessagesQuery,
  ): Promise<MessagePageView> {
    return this.chat.history(user.id, userId, query);
  }

  // POST /api/chat/:userId/messages: send a text or an invitation.
  @Post(':userId/messages')
  @Throttle({ default: { limit: SEND_LIMIT_PER_MINUTE, ttl: 60_000 } })
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageView> {
    return this.chat.send(user.id, userId, dto);
  }

  // POST /api/chat/:userId/read: "I read what they sent".
  @Post(':userId/read')
  @HttpCode(200)
  read(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ readAt: Date }> {
    return this.chat.markRead(user.id, userId);
  }

  // POST /api/chat/:userId/typing: "I am typing". Stores nothing.
  @Post(':userId/typing')
  @HttpCode(200)
  typing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.chat.typing(user.id, userId);
  }
}
