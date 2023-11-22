import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdGroup, MdPersonAddAlt1, MdPerson } from 'react-icons/md';
import { Alert, Button, Form, Input, InputNumber, Select, Table, message } from 'antd';

import { createOperator, getOperator, updateOperator } from '@/Panel/api/operator';
import { useOperators } from '@/Panel/hooks/operator';
import { OperatorRole } from '@/Panel/types';
import { Container } from '../components/Container';

export function Operators() {
  const { data, isLoading } = useOperators();

  return (
    <Container
      header={{
        Icon: MdGroup,
        title: '客服',
        extra: (
          <Link to="new">
            <Button type="primary">添加客服</Button>
          </Link>
        ),
      }}
    >
      <Table
        loading={isLoading}
        dataSource={data}
        rowKey="id"
        pagination={false}
        columns={[
          {
            dataIndex: 'username',
            title: '用户名',
          },
          {
            dataIndex: 'externalName',
            title: '外部名称',
          },
          {
            dataIndex: 'internalName',
            title: '内部名称',
          },
          {
            dataIndex: 'role',
            title: '角色',
            render: (role: OperatorRole) =>
              ({ [OperatorRole.Operator]: '客服', [OperatorRole.Admin]: '管理员' })[role],
          },
          {
            key: 'actions',
            width: 200,
            render: (operator) => <Link to={operator.id}>编辑</Link>,
          },
        ]}
      />
    </Container>
  );
}

interface OperatorFormData {
  username: string;
  password: string;
  role: number;
  externalName: string;
  internalName: string;
  concurrency: number;
}

interface OperatorFormProps {
  initData?: Partial<OperatorFormData>;
  usernameDisabled?: boolean;
  passwordRequired?: boolean;
  passwordPlaceholder?: string;
  onSubmit: (data: OperatorFormData) => void;
  submitting?: boolean;
  submitButtonText?: string;
}

function OperatorForm({
  initData,
  usernameDisabled,
  passwordRequired = true,
  passwordPlaceholder,
  onSubmit,
  submitting,
  submitButtonText = '保存',
}: OperatorFormProps) {
  return (
    <Form
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      autoComplete="off"
      initialValues={initData}
      onFinish={onSubmit}
    >
      <Form.Item
        label="用户名"
        name="username"
        rules={[{ required: !usernameDisabled }, { min: 6, max: 24 }, { pattern: /[0-9a-zA-Z_]/ }]}
      >
        <Input disabled={usernameDisabled} />
      </Form.Item>

      <Form.Item
        label="密码"
        name="password"
        rules={[{ required: passwordRequired, min: 6, max: 64 }]}
      >
        <Input.Password placeholder={passwordPlaceholder} />
      </Form.Item>

      <Form.Item label="角色" name="role">
        <Select
          options={[
            { label: '客服', value: OperatorRole.Operator },
            { label: '管理员', value: OperatorRole.Admin },
          ]}
        />
      </Form.Item>

      <Form.Item label="外部名称" name="externalName" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item label="内部名称" name="internalName" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item
        label="同时接待量"
        name="concurrency"
        rules={[{ required: true, type: 'integer', min: 0 }]}
      >
        <InputNumber min={0} />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {submitButtonText}
        </Button>
      </Form.Item>
    </Form>
  );
}

export function NewOperator() {
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const { mutate, isLoading, error } = useMutation({
    mutationFn: createOperator,
    onSuccess: () => {
      queryClient.invalidateQueries(['Operators']);
      message.success('已添加');
      navigate('..');
    },
  });

  return (
    <Container
      header={{
        Icon: MdPersonAddAlt1,
        title: '添加客服',
      }}
    >
      {(error as Error | null) && (
        <Alert
          type="error"
          message={(error as Error).message}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      <OperatorForm
        initData={{
          role: OperatorRole.Operator,
          concurrency: 5,
        }}
        onSubmit={mutate}
        submitButtonText="添加"
        submitting={isLoading}
      />
    </Container>
  );
}

export function EditOperator() {
  const { id } = useParams();

  const { data, isFetching } = useQuery({
    enabled: !!id,
    queryKey: ['Operator', id],
    queryFn: () => getOperator(id!),
  });

  const queryClient = useQueryClient();

  const {
    mutate,
    isLoading: isUpdating,
    error: updateError,
  } = useMutation({
    mutationFn: updateOperator,
    onSuccess: () => {
      queryClient.invalidateQueries(['Operator', id]);
      queryClient.invalidateQueries(['Operators']);
      message.success('已保存');
    },
  });

  return (
    <Container
      header={{
        Icon: MdPerson,
        title: '编辑客服',
      }}
      loading={isFetching}
    >
      {(updateError as Error | null) && (
        <Alert
          type="error"
          message={(updateError as Error).message}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      <OperatorForm
        initData={data}
        usernameDisabled
        passwordRequired={false}
        passwordPlaceholder="修改密码"
        submitting={isUpdating}
        onSubmit={(data) => {
          mutate({
            id: id!,
            password: data.password || undefined,
            role: data.role,
            externalName: data.externalName,
            internalName: data.internalName,
            concurrency: data.concurrency,
          });
        }}
      />
    </Container>
  );
}
