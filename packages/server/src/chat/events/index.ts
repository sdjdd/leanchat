import type { OperatorStatus } from '../constants';
import { PreviousStatus, UpdateConversationData } from '../interfaces';
import type { Conversation, Message } from '../models';

export interface ConversationCreatedEvent {
  conversation: Conversation;
}

export interface ConversationUpdatedEvent {
  conversation: Conversation;
  data: UpdateConversationData;
}

export interface MessageCreatedEvent {
  message: Message;
}

export interface OperatorStatusChangedEvent {
  operatorId: string;
  status: OperatorStatus;
  previous?: PreviousStatus;
}
