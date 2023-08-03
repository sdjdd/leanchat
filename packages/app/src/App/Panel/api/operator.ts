import { client } from './client';

export interface Operator {
  id: string;
  username: string;
  externalName: string;
  internalName: string;
}

export async function getOperator(id: string) {
  const res = await client.get<Operator>(`/operators/${id}`);
  return res.data;
}

interface GetOperatorsOptions {
  page?: number;
  pageSize?: number;
}

export async function getOperators({ page, pageSize }: GetOperatorsOptions) {
  const res = await client.get<Operator[]>('/operators', {
    params: { page, pageSize },
  });
  const count = parseInt(res.headers['x-total-count']);
  return {
    count,
    items: res.data,
  };
}

interface CreateOpeatorData {
  username: string;
  password: string;
  externalName: string;
  internalName: string;
  concurrency: number;
}

export async function createOperator(data: CreateOpeatorData) {
  const res = await client.post<Operator>('/operators', data);
  return res.data;
}

interface UpdateOperatorData {
  id: string;
  password?: string;
  externalName?: string;
  internalName?: string;
  concurrency?: number;
}

export async function updateOperator({ id, ...data }: UpdateOperatorData) {
  const res = await client.patch<Operator>(`/operators/${id}`, data);
  return res.data;
}
