import { MessageDocument } from 'src/message';

export class MessageDto {
  id: string;

  visitorId: string;

  conversationId: string;

  type: string;

  from: any;

  data: any;

  createdAt: string;

  updatedAt: string;

  static fromDocument(message: MessageDocument) {
    const dto = new MessageDto();
    dto.id = message.id;
    dto.visitorId = message.visitor._id.toString();
    dto.conversationId = message.conversation._id.toString();
    dto.type = message.type;
    dto.from = message.from;
    dto.data = message.data;
    dto.createdAt = message.createdAt.toISOString();
    dto.updatedAt = message.updatedAt.toISOString();
    return dto;
  }
}
