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
import { SEND_LIMIT_PER_MINUTE } from './chat.constants.js';
import { ChatService } from './chat.service.js';
import {
  ConversationResponse,
  MessagePageResponse,
  MessageResponse,
  ReadResultResponse,
} from './dto/chat.responses.js';
import { ListMessagesQuery } from './dto/list-messages.query.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import type {
  ConversationView,
  MessagePageView,
  MessageView,
} from './message-view.js';

// WHY THIS FILE EXISTS
// The doorway to the chat: routes, input checks, then the service. Every route
// needs a logged-in user, and `:userId` is always the OTHER player.
@ApiTags('chat')
@ApiCookieAuth('session')
@UseGuards(SessionGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  // GET /api/chat/conversations: the Messages page list.
  @Get('conversations')
  @ApiOperation({
    summary: 'My conversations',
    description:
      'One per player you have at least one message with, latest message first. Not paginated.',
  })
  @ApiOkResponse({ type: [ConversationResponse] })
  conversations(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConversationView[]> {
    return this.chat.conversations(user.id);
  }

  // GET /api/chat/:userId/messages: one conversation, newest page first.
  @Get(':userId/messages')
  @ApiOperation({
    summary: 'Messages with a player',
    description:
      'Without `before`: the latest `limit` messages. With `before` (a message id of this conversation): the ones just before it. Errors: USER_NOT_FOUND, VALIDATION_ERROR.',
  })
  @ApiOkResponse({ type: MessagePageResponse })
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
  @ApiOperation({
    summary: 'Send a message or an invitation',
    description:
      'Send `{ body }` (1 to 500 characters) OR `{ matchId }` (a waiting match you created for this player). Errors: BLOCKED, INVALID_INVITE, USER_NOT_FOUND, VALIDATION_ERROR.',
  })
  @ApiCreatedResponse({ type: MessageResponse })
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
  @ApiOperation({
    summary: 'Mark a conversation as read',
    description: 'The other player is told live (`chat:read`), so they see "Seen".',
  })
  @ApiOkResponse({ type: ReadResultResponse })
  read(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ readAt: Date }> {
    return this.chat.markRead(user.id, userId);
  }

  // POST /api/chat/:userId/typing: "I am typing". Stores nothing.
  @Post(':userId/typing')
  @HttpCode(200)
  @ApiOperation({
    summary: '"Is typing" signal',
    description: 'Only relays `chat:typing` to the other player. `data` is null.',
  })
  @ApiOkResponse({ description: 'Signal sent. `data` is null.' })
  typing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.chat.typing(user.id, userId);
  }
}
