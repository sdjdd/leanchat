import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { AutoAssignJobData } from '../interfaces';
import { ChatService } from '../services';
import { UserType } from '../constants';

@Processor('auto_assign_conversation')
export class AutoAssignProcessor {
  constructor(private chatService: ChatService) {}

  @Process()
  async assign(job: Job<AutoAssignJobData>) {
    const { conversationId } = job.data;
    const operator = await this.chatService.getRandomReadyOperator();
    if (operator) {
      await this.chatService.assignConversation(conversationId, operator, {
        type: UserType.System,
      });
    } else {
      await this.chatService.enqueueConversation(conversationId);
    }
  }
}
