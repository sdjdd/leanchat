export interface GreetingConfig {
  enabled: boolean;
  message: {
    text: string;
  };
}

export interface OperatorWelcomeMessageConfig {
  enabled: boolean;
  text: string;
}

export interface AutoCloseConfig {
  timeout: number;
  message: {
    enabled: boolean;
    text: string;
  };
}

export interface QueueConfig {
  capacity: number;
  fullMessage: {
    enabled: boolean;
    text: string;
  };
  queuedMessage: {
    enabled: boolean;
    text: string;
  };
}

export interface ConfigKeys {
  greeting: GreetingConfig;
  operatorWelcomeMessage: OperatorWelcomeMessageConfig;
  autoClose: AutoCloseConfig;
  queue: QueueConfig;
}
