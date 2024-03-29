import type { Conversation } from 'src/chat';
import type { VisitorDto } from '../visitor';
import { MessageDto } from '../message';

export class ConversationDto {
  id: string;

  channel: number;

  source?: {
    url?: string;
  };

  status: number;

  visitorId: string;

  chatbotId?: string;

  operatorId?: string;

  categoryId?: string;

  evaluation?: {
    star: number;
    feedback?: string;
    tags?: string[];
  };

  evaluationInvitedAt?: string;

  visitorWaitingSince?: string;

  createdAt: string;

  updatedAt: string;

  queuedAt?: string;

  closedAt?: string;

  closedBy?: {
    type: number;
    id?: string;
  };

  messages?: MessageDto[];

  lastMessage?: MessageDto;

  visitor?: VisitorDto;

  joinedOperatorIds?: string[];

  stats?: Record<string, any>;

  static fromDocument(conv: Conversation) {
    const dto = new ConversationDto();
    dto.id = conv.id ?? conv._id.toHexString();
    dto.channel = conv.channel;
    dto.source = conv.source;
    dto.status = conv.status;
    dto.visitorId = conv.visitorId.toString();
    dto.chatbotId = conv.chatbotId?.toString();
    dto.operatorId = conv.operatorId?.toString();
    dto.categoryId = conv.categoryId?.toString();
    dto.evaluation = conv.evaluation;
    dto.evaluationInvitedAt = conv.evaluationInvitedAt?.toISOString();
    dto.visitorWaitingSince = conv.visitorWaitingSince?.toISOString();
    dto.createdAt = conv.createdAt.toISOString();
    dto.updatedAt = conv.updatedAt.toISOString();
    dto.queuedAt = conv.queuedAt?.toISOString();
    dto.closedAt = conv.closedAt?.toISOString();
    dto.closedBy = conv.closedBy && {
      type: conv.closedBy.type,
      id: conv.closedBy.id?.toString(),
    };
    dto.stats = conv.stats;
    return dto;
  }
}
