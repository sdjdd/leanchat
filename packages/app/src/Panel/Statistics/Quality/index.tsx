import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToggle } from 'react-use';
import { Button, Table } from 'antd';
import { ColumnType } from 'antd/es/table';
import dayjs from 'dayjs';
import _ from 'lodash';
import { eq, find, get, identity, join, map } from 'lodash/fp';

import { SearchConversationOptions, searchConversation } from '@/Panel/api/conversation';
import { useCategories } from '@/Panel/hooks/category';
import { useOperators } from '@/Panel/hooks/operator';
import { useChatbots } from '@/Panel/hooks/chatbot';
import { useSelector } from '@/Panel/hooks/useSelector';
import { defaultTo, flow, formatDate, toSeconds } from '@/Panel/Statistics/helpers';
import { SearchForm, SearchFormData } from './components/SearchForm';
import { UserType, Conversation } from '../../types';
import { ConversationInfo } from '../components/ConversationInfo';
import * as render from '../render';
import { ExportDataDialog, ExportDataColumn } from '../components/ExportDataDialog';
import { useGetCategoryName } from '../hooks/useGetCategoryName';

export default function Quality() {
  const [options, setOptions] = useState<SearchConversationOptions>({
    from: dayjs().startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
    page: 1,
    pageSize: 20,
    count: true,
  });

  const { data, isFetching } = useQuery({
    queryKey: ['SearchConversationResult', options],
    queryFn: () => searchConversation(options),
  });

  const handleSearchFormSubmit = (data: SearchFormData) => {
    const { id, date, message, categoryId, visitorId, operatorId, closedBy, evaluation } = data;
    setOptions((prev) => ({
      ...prev,
      page: 1,
      id,
      from: date?.[0].startOf('day').toISOString(),
      to: date?.[1].endOf('day').toISOString(),
      message,
      categoryId: categoryId ? [categoryId] : undefined,
      visitorId: visitorId ? [visitorId] : undefined,
      operatorId,
      closedBy,
      evaluation,
    }));
  };

  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: operators, isLoading: isLoadingOperators } = useOperators();
  const { data: chatbots, isLoading: isLoadingChatbots } = useChatbots();

  const getCategoryName = useGetCategoryName(categories);
  const getOperatorName = useSelector(operators, 'id', 'internalName');
  const getChatbotName = useSelector(chatbots, 'id', 'name');

  const [exportModalOpen, toggleExportModal] = useToggle(false);
  const handleExportData = () => {
    if (!data || isLoadingCategories || isLoadingOperators || isLoadingChatbots) {
      return;
    }
    if (data.totalCount > 50000) {
      alert('导出数据量过大，请缩小检索范围');
      return;
    }
    toggleExportModal();
  };

  const [selectedConvId, setSelectedConvId] = useState<string>();

  const columns: (ColumnType<Conversation> & ExportDataColumn)[] = [
    {
      key: 'id',
      title: '会话ID',
      render: render.id,
    },
    {
      key: 'createdAt',
      title: '会话开始时间',
      render: render.createdAt,
    },
    {
      key: 'closedAt',
      title: '会话结束时间',
      render: render.closedAt,
    },
    {
      key: 'categoryId',
      title: '咨询类型',
      render: flow([get('categoryId'), getCategoryName]),
    },
    {
      key: 'visitorId',
      title: '用户ID',
      render: render.visitorId,
    },
    {
      key: 'operatorId',
      title: '负责客服',
      render: render.operatorName(getOperatorName),
    },
    {
      key: 'joinedOperatorIds',
      title: '参与客服',
      render: flow([
        get('joinedOperatorIds'),
        map(defaultTo(getOperatorName, identity)),
        join(','),
      ]),
    },
    {
      key: 'chatbotId',
      title: '机器人',
      render: flow([get('chatbotId'), getChatbotName]),
    },
    {
      key: 'messageCount',
      title: '消息条数',
      render: flow([
        _.over([get('stats.operatorMessageCount'), get('stats.visitorMessageCount')]),
        _.sum,
      ]),
    },
    {
      key: 'operatorMessageCount',
      title: '客服消息条数',
      render: get('stats.operatorMessageCount'),
    },
    {
      key: 'visitorMessageCount',
      title: '用户消息条数',
      render: get('stats.visitorMessageCount'),
    },
    {
      key: 'round',
      title: '会话回合数',
      render: get('stats.round'),
    },
    {
      key: 'duration',
      title: '会话持续时长(秒)',
      render: flow([get('stats.duration'), toSeconds]),
    },
    {
      key: 'closedBy',
      title: '咨询结束人',
      render: flow([
        get('closedBy.type'),
        _.cond([
          [eq(UserType.Visitor), _.constant('用户')],
          [eq(UserType.Operator), _.constant('客服')],
          [eq(UserType.System), _.constant('系统')],
        ]),
      ]),
    },
    {
      key: 'consultationResult',
      title: '咨询结果',
      render: render.consultationResult,
    },
    {
      key: 'evaluationInvited',
      title: '是否邀请评价',
      render: render.evaluationInvited,
    },
    {
      key: 'evaluationStar',
      title: '满意度',
      render: render.evaluationStar,
    },
    {
      key: 'evaluationFeedback',
      title: '客户建议',
      render: get('evaluation.feedback'),
    },
    {
      key: 'firstResponseTime',
      title: '首次响应时间(秒)',
      render: flow([get('stats.firstResponseTime'), toSeconds]),
    },
    {
      key: 'firstMessageFrom',
      title: '第一次发言者类型',
      render: render.firstMessageFromType,
    },
    {
      key: 'firstMessageCreatedAt',
      title: '第一条消息时间',
      render: render.firstMessageCreatedAt,
    },
    {
      key: 'lastMessageFrom',
      title: '最后发言者类型',
      render: render.lastMessageFromType,
    },
    {
      key: 'lastMessageCreatedAt',
      title: '最后一条消息时间',
      render: render.lastMessageCreatedAt,
    },
    {
      key: 'maxResponseTime',
      title: '最长响应时间(秒)',
      render: flow([get('stats.maxResponseTime'), toSeconds]),
    },
    {
      key: 'chatDuration',
      title: '会话聊天时长(秒)',
      render: flow([render.chatDuration, toSeconds]),
    },
    {
      key: 'receptionTime',
      title: '会话总时长(秒)',
      render: render.receptionTime,
    },
    {
      key: 'queuedAtOrfirstOperatorJoinedAt',
      title: '第一次转人工时间',
      render: flow([
        _.over([get('queuedAt'), get('stats.firstOperatorJoinedAt')]),
        find(_.isString),
        formatDate,
      ]),
    },
    {
      key: 'firstOperatorJoinedAt',
      title: '成功转人工时间',
      render: flow([get('stats.firstOperatorJoinedAt'), formatDate]),
    },
    {
      key: 'queueConnectionTime',
      title: '排队等待时长(秒)',
      render: flow([get('stats.queueConnectionTime'), toSeconds]),
    },
  ];

  return (
    <div className="p-5 bg-white h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium mb-5">互动记录</h1>
        <Button onClick={handleExportData} disabled={!data || !data.totalCount}>
          导出
        </Button>
      </div>
      <div className="grid grid-cols-[400px_1fr] gap-4">
        <div>
          <SearchForm
            initData={{
              date: [dayjs(), dayjs()],
            }}
            onSubmit={handleSearchFormSubmit}
          />
        </div>
        <div className="overflow-hidden">
          <Table
            loading={isFetching}
            dataSource={data?.data}
            rowKey={(row) => row.id}
            scroll={{ x: 'max-content' }}
            pagination={{
              total: data?.totalCount,
              current: options.page,
              pageSize: options.pageSize,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                setOptions((prev) => ({ ...prev, page, pageSize }));
              },
            }}
            columns={[
              ...columns,
              {
                key: 'detail',
                title: '操作',
                fixed: 'right',
                render: (conv) => <a onClick={() => setSelectedConvId(conv.id)}>详情</a>,
              },
            ]}
          />
        </div>

        <ExportDataDialog
          open={exportModalOpen}
          onClose={toggleExportModal}
          searchOptions={options}
          columns={[
            ...columns,
            {
              key: 'detail',
              title: '详情',
              render: flow([
                get('messages'),
                map(render.renderMessage(getOperatorName, getChatbotName)),
                join('\n'),
              ]),
            },
          ]}
        />

        <ConversationInfo
          conversationId={selectedConvId}
          onClose={() => setSelectedConvId(undefined)}
        />
      </div>
    </div>
  );
}
