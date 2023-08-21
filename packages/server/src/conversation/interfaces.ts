import { Message } from 'src/message';

export interface UpdateConversationData {
  status?: string;
  operatorId?: string;
  lastMessage?: Message;
  queuedAt?: Date;
  visitorLastActivityAt?: Date;
}

export interface GetConversationOptions {
  status?: string;
  visitorId?: string;
  operatorId?: string | null;

  sort?: string;
  desc?: boolean;
  limit?: number;
}
