import { Conversation } from 'src/chat';

export class ConversationDto {
  id: string;

  status: number;

  operatorJoined: boolean;

  evaluation?: Conversation['evaluation'];

  queuedAt?: string;

  static fromDocument(conv: Conversation) {
    const dto = new ConversationDto();
    dto.id = conv.id;
    dto.status = conv.status;
    dto.operatorJoined = !!conv.operatorId;
    dto.evaluation = conv.evaluation;
    dto.queuedAt = conv.queuedAt?.toISOString();
    return dto;
  }
}
