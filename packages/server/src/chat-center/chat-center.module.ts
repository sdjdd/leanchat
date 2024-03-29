import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypegooseModule } from '@m8a/nestjs-typegoose';

import { ChatModule } from 'src/chat';
import { CategoryModule } from 'src/category';
import { QuickReplyModule } from 'src/quick-reply';
import {
  OperatorGroup,
  OperatorOnlineRecord,
  OperatorWorkingTime,
} from './models';
import { ChatGateway } from './chat.gateway';
import {
  AutoCloseConversationService,
  ConversationTransformService,
  OperatorGroupService,
  OperatorOnlineService,
  OperatorWorkingTimeService,
  SessionService,
} from './services';
import {
  APIController,
  CategoryController,
  ChatbotController,
  ChatbotQuestionBaseController,
  ConfigController,
  ConversationController,
  OperatorController,
  OperatorGroupController,
  QuickReplyController,
  SessionController,
  StatisticsController,
  VisitorController,
} from './controllers';
import { MessageDto } from './dtos/message';

@Module({
  imports: [
    TypegooseModule.forFeature([
      OperatorOnlineRecord,
      OperatorWorkingTime,
      OperatorGroup,
    ]),
    ChatModule,
    CategoryModule,
    QuickReplyModule,
  ],
  providers: [
    ChatGateway,
    AutoCloseConversationService,
    OperatorGroupService,
    OperatorOnlineService,
    OperatorWorkingTimeService,
    ConversationTransformService,
    SessionService,
  ],
  controllers: [
    APIController,
    OperatorController,
    SessionController,
    ConversationController,
    VisitorController,
    CategoryController,
    QuickReplyController,
    ConfigController,
    StatisticsController,
    OperatorGroupController,
    ChatbotController,
    ChatbotQuestionBaseController,
  ],
})
export class ChatCenterModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    MessageDto.fileDomain = this.configService.getOrThrow(
      'LEANCHAT_FILE_DOMAIN',
    );
  }
}
