import { Types } from 'mongoose';

import type { Conversation } from '../models';
import { NumberCondition, UserInfo } from './common';
import {
  Channel,
  ConsultationResult,
  ConversationStatus,
  UserType,
} from '../constants';

export interface CreateConversationData {
  channel: Channel;
  source?: {
    url?: string;
  };
  visitorId: string;
}

export interface ConversationFilters {
  status?: ConversationStatus;
  operatorId?: string | null;
  desc?: boolean;
  before?: Date;
  after?: Date;
}

export interface GetConversationOptions extends ConversationFilters {
  skip?: number;
  limit?: number;
}

export interface ConversationEvaluation {
  star: number;
  feedback?: string;
  tags?: string[];
}

export interface UpdateConversationData {
  status?: ConversationStatus;
  chatbotId?: string;
  operatorId?: string;
  categoryId?: string;
  evaluation?: ConversationEvaluation;
  evaluationInvitedAt?: Date;
  closedAt?: Date;
  closedBy?: UserInfo;
  queuedAt?: Date;
  visitorLastActivityAt?: Date;
  operatorLastActivityAt?: Date;
  visitorWaitingSince?: Date | null;
  stats?: Conversation['stats'];
}

export interface GetInactiveConversationIdsOptions {
  lastActivityBefore: Date;
  limit: number;
}

export interface CloseConversationOptions {
  conversationId: string | Types.ObjectId;
  by: UserInfo;
}

export interface ReopenConversationOptions {
  conversationId: string | Types.ObjectId;
  by: UserInfo;
}

export interface ConversationStatsJobData {
  conversationId: string;
}

export interface GetConversationStatsOptions {
  from: Date;
  to: Date;
  channel?: string;
  operatorId?: string[];
}

export interface GetConversationMessageStatsOptions {
  from: Date;
  to: Date;
  channel?: string;
  operatorId?: string[];
}

export interface SearchConversationOptions {
  id?: string | string[];
  from?: Date;
  to?: Date;
  status?: ConversationStatus;
  channel?: Channel;
  categoryId?: string[];
  visitorId?: string[];
  operatorId?: string[] | null;
  closedBy?: UserType;
  evaluation?: {
    invited?: boolean;
    star?: number;
  };
  message?: {
    text?: string;
    from?: UserType;
  };
  duration?: NumberCondition;
  averageResponseTime?: NumberCondition;
  queued?: boolean;
  consultationResult?: ConsultationResult;

  skip?: number;
  limit?: number;
  desc?: boolean;

  messages?: number;
  lastMessage?: boolean;
  count?: boolean;
}
