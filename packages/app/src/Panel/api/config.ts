import { client } from './client';

export interface GreetingMessageConfig {
  enabled: boolean;
  text: string;
}

export interface NoReadyOperatorMessageConfig {
  text: string;
}

export interface AutoCloseConfig {
  /**
   * In seconds
   */
  timeout: number;
  message: {
    enabled: boolean;
    text: string;
  };
}

export interface QueueConfig {
  capacity: number;
  fullMessage: {
    text: string;
  };
  queuedMessage: {
    text: string;
  };
}

export interface EvaluationConfig {
  tag: {
    positive: {
      options: string[];
      required: boolean;
    };
    negative: {
      options: string[];
      required: boolean;
    };
  };
  /**
   * In seconds
   */
  timeout?: number;
}

export async function getConfig<T>(key: string) {
  const res = await client.get<T | null>(`/config/${key}`);
  return res.data;
}

export async function setConfig(key: string, data: any) {
  await client.put(`/config/${key}`, data);
}
