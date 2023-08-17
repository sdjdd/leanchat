export interface GetVisitorsOptions {
  conditions: {
    status?: string;
    operatorId?: string | null;
  };
  orderBy?: string;
  desc?: boolean;
}

export interface UpdateVisitorData {
  currentConversationId?: string;
}