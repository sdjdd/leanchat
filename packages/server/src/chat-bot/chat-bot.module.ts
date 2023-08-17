import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { ConversationModule } from 'src/conversation/conversation.module';
import { MessageModule } from 'src/message/message.module';
import { ChatBotService } from './chat-bot.service';
import { QUEUE_CHAT_BOT_DISPATCH, QUEUE_CHAT_BOT_PROCESS } from './constants';
import {
  ChatBotDispatchProcessor,
  ChatBotProcessProcessor,
} from './processors';
import { EventHandler } from './event-handler';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_CHAT_BOT_DISPATCH,
    }),
    BullModule.registerQueue({
      name: QUEUE_CHAT_BOT_PROCESS,
    }),
    ConversationModule,
    MessageModule,
  ],
  providers: [
    ChatBotService,
    ChatBotDispatchProcessor,
    ChatBotProcessProcessor,
    EventHandler,
  ],
  exports: [ChatBotService],
})
export class ChatBotModule {}