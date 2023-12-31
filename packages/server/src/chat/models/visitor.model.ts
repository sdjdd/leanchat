import { Index, ModelOptions, Prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

@Index({ createdAt: 1 })
@ModelOptions({
  schemaOptions: {
    collection: 'visitor',
    timestamps: true,
  },
})
export class Visitor {
  _id: Types.ObjectId;

  id: string;

  @Prop()
  currentConversationId?: Types.ObjectId;

  @Prop()
  name?: string;

  @Prop()
  comment?: string;

  createdAt: Date;

  updatedAt: Date;
}
