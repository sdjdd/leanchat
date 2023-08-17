import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { Conversation, ConversationService } from 'src/conversation';
import { Operator } from 'src/operator';

import { REDIS } from 'src/redis';
import {
  ConversationAssignedEvent,
  ConversationClosedEvent,
  ConversationQueuedEvent,
} from '../events';

@Injectable()
export class ChatConversationService {
  @Inject(REDIS)
  private redis: Redis;

  constructor(
    private events: EventEmitter2,
    private conversationService: ConversationService,
  ) {}

  async enqueue(conv: Conversation) {
    const score = await this.redis.zscore('conversation_queue', conv.id);
    if (!score) {
      return;
    }
    const newConv = await this.conversationService.updateConversation(conv, {
      status: 'queued',
      queuedAt: new Date(Number(score)),
    });
    this.events.emit('conversation.queued', {
      conversation: newConv,
    } satisfies ConversationQueuedEvent);
  }

  async assign(conv: Conversation, operator: Operator) {
    const newConv = await this.conversationService.updateConversation(conv, {
      status: 'inProgress',
      operatorId: operator.id,
    });

    await this.redis
      .pipeline()
      .zrem('conversation_queue', conv.id)
      .hincrby('operator_concurrency', operator.id, 1)
      .exec();

    this.events.emit('conversation.assigned', {
      conversation: newConv,
    } satisfies ConversationAssignedEvent);
  }

  async close(conv: Conversation) {
    const newConv = await this.conversationService.updateConversation(conv, {
      status: 'solved',
    });

    if (conv.operatorId) {
      await this.redis.hincrby('operator_concurrency', conv.operatorId, -1);
    }

    this.events.emit('conversation.closed', {
      conversation: newConv,
    } satisfies ConversationClosedEvent);
  }
}