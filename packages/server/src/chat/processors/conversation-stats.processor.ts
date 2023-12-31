import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { differenceInMilliseconds, isAfter, isBefore } from 'date-fns';
import _ from 'lodash';

import { ConversationStatsJobData } from '../interfaces';
import { ConversationService, MessageService } from '../services';
import { Conversation, Message } from '../models';
import { ConsultationResult, MessageType, UserType } from '../constants';

@Processor('conversation_stats')
export class ConversationStatsProcessor {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  @Process()
  async process(job: Job<ConversationStatsJobData>) {
    const conversation = await this.conversationService.getConversation(
      job.data.conversationId,
    );
    if (!conversation || !conversation.closedAt) {
      return;
    }

    const messages = await this.messageService.getMessages({
      conversationId: conversation.id,
      limit: 500,
    });

    const chatMessages = messages.filter(
      (m) =>
        m.type === MessageType.Message &&
        (m.from.type === UserType.Visitor || m.from.type === UserType.Operator),
    );

    const stats: Conversation['stats'] = {};

    const messageCount = _.countBy(chatMessages, (m) => m.from.type);
    stats.visitorMessageCount = messageCount[UserType.Visitor] || 0;
    stats.operatorMessageCount = messageCount[UserType.Operator] || 0;

    const firstAssignMessage = messages.find(
      (m) => m.type === MessageType.Assign,
    );
    if (firstAssignMessage) {
      stats.firstOperatorJoinedAt = firstAssignMessage.createdAt;
      const responseTimeList = this.getResponseTimeList(
        chatMessages,
        firstAssignMessage.createdAt,
      );
      if (responseTimeList.length) {
        stats.firstResponseTime = responseTimeList[0];
        stats.maxResponseTime = _.max(responseTimeList);
        stats.responseTime = _.sum(responseTimeList);
        stats.responseCount = responseTimeList.length;
        stats.averageResponseTime = stats.responseTime / stats.responseCount;
      }

      const communicateMessages = chatMessages.filter((message) =>
        isAfter(message.createdAt, firstAssignMessage.createdAt),
      );

      const hasVisitorMessage = communicateMessages.some(
        (message) => message.from.type === UserType.Visitor,
      );
      const hasOperatorMessage = communicateMessages.some(
        (message) => message.from.type === UserType.Operator,
      );
      if (hasOperatorMessage) {
        if (hasVisitorMessage) {
          stats.consultationResult = ConsultationResult.Valid;
        } else {
          stats.consultationResult = ConsultationResult.Invalid;
        }
      } else {
        stats.consultationResult = ConsultationResult.OperatorNoResponse;
      }

      if (communicateMessages.length > 1) {
        stats.receptionTime = differenceInMilliseconds(
          communicateMessages[communicateMessages.length - 1].createdAt,
          communicateMessages[0].createdAt,
        );
      }
    }

    stats.operatorFirstMessageCreatedAt = chatMessages.find(
      (m) => m.from.type === UserType.Operator,
    )?.createdAt;
    stats.operatorLastMessageCreatedAt = _.findLast(
      chatMessages,
      (m) => m.from.type === UserType.Operator,
    )?.createdAt;
    stats.visitorFirstMessageCreatedAt = chatMessages.find(
      (m) => m.from.type === UserType.Visitor,
    )?.createdAt;
    stats.visitorLastMessageCreatedAt = _.findLast(
      chatMessages,
      (m) => m.from.type === UserType.Visitor,
    )?.createdAt;

    if (conversation.queuedAt) {
      if (
        firstAssignMessage &&
        isBefore(firstAssignMessage.createdAt, conversation.closedAt)
      ) {
        stats.queueConnectionTime = differenceInMilliseconds(
          firstAssignMessage.createdAt,
          conversation.queuedAt,
        );
      } else {
        stats.queueTimeToLeave = differenceInMilliseconds(
          conversation.closedAt,
          conversation.queuedAt,
        );
      }
    }

    const assignMessages = messages.filter(
      (message) => message.type === MessageType.Assign,
    );
    stats.reassigned = assignMessages.length > 1;

    stats.duration = differenceInMilliseconds(
      conversation.closedAt,
      conversation.createdAt,
    );

    stats.round = this.getRound(chatMessages);

    await this.conversationService.updateConversation(conversation.id, {
      stats,
    });
  }

  private getResponseTimeList(
    chatMessages: Message[],
    firstOperatorJoinedAt: Date,
  ) {
    const list: number[] = [];
    let checkpoint: Date | undefined = firstOperatorJoinedAt;
    for (const message of chatMessages) {
      switch (message.from.type) {
        case UserType.Visitor:
          checkpoint ||= message.createdAt;
          break;
        case UserType.Operator:
          if (checkpoint) {
            list.push(differenceInMilliseconds(message.createdAt, checkpoint));
            checkpoint = undefined;
          }
          break;
      }
    }
    return list;
  }

  private getRound(messages: Message[]) {
    let round = 0;
    let lastUserType: UserType | undefined;
    for (const message of messages) {
      if (
        message.from.type === UserType.Operator &&
        lastUserType === UserType.Visitor
      ) {
        round += 1;
      }
      lastUserType = message.from.type;
    }
    return round;
  }
}
