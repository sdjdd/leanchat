import { Message } from 'src/chat';

export class MessageDto {
  id: string;

  visitorId: string;

  conversationId: string;

  type: number;

  from: any;

  data: any;

  createdAt: string;

  updatedAt: string;

  static fromDocument(message: Message) {
    const dto = new MessageDto();
    dto.id = message.id;
    dto.visitorId = message.visitorId.toString();
    dto.conversationId = message.conversationId.toString();
    dto.type = message.type;
    dto.from = message.from;
    dto.data = message.data;
    dto.createdAt = message.createdAt.toISOString();
    dto.updatedAt = message.updatedAt.toISOString();
    return dto;
  }
}
