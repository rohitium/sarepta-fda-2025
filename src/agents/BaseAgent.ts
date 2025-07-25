import { BaseAgent as IBaseAgent, BaseAgentConfig, AgentResponse, AgentStatus } from '../types/agents';

export abstract class BaseAgent implements IBaseAgent {
  public readonly config: BaseAgentConfig;
  private status: AgentStatus = AgentStatus.IDLE;
  private lastError?: string;

  constructor(config: BaseAgentConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract execute(input: unknown): Promise<AgentResponse>;

  async cleanup(): Promise<void> {
    this.status = AgentStatus.IDLE;
    this.lastError = undefined;
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  protected setStatus(status: AgentStatus): void {
    this.status = status;
  }

  protected setError(error: string): void {
    this.lastError = error;
    this.status = AgentStatus.ERROR;
  }

  protected getError(): string | undefined {
    return this.lastError;
  }

  protected createSuccessResponse<T>(data: T, metadata?: Record<string, unknown>): AgentResponse<T> {
    return {
      success: true,
      data,
      metadata,
      timestamp: new Date(),
      agentId: this.config.id
    };
  }

  protected createErrorResponse(error: string, metadata?: Record<string, unknown>): AgentResponse {
    return {
      success: false,
      error,
      metadata,
      timestamp: new Date(),
      agentId: this.config.id
    };
  }

  protected async safeExecute<T>(operation: () => Promise<T>): Promise<T> {
    this.setStatus(AgentStatus.PROCESSING);
    
    try {
      const result = await operation();
      this.setStatus(AgentStatus.IDLE);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setError(errorMessage);
      throw error;
    }
  }

  protected log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
    // Log data is prepared but not used in demo mode
    const logData = {
      agent: this.config.id,
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(data && { data })
    };
    
    // Use logData to avoid unused variable warning
    if (process.env.NODE_ENV === 'development') {
      console.log(logData);
    }

    switch (level) {
      case 'error':
        console.error(`[${this.config.id}]`, message, data);
        break;
      case 'warn':
        console.warn(`[${this.config.id}]`, message, data);
        break;
      default:
        console.log(`[${this.config.id}]`, message, data);
    }
  }

  // Utility methods for common operations
  protected generateId(): string {
    return `${this.config.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; timeMs: number }> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      
      try {
        const result = await operation();
        const timeMs = Date.now() - startTime;
        resolve({ result, timeMs });
      } catch (error) {
        reject(error);
      }
    });
  }

  protected validateInput(input: Record<string, unknown>, requiredFields: string[]): void {
    if (!input) {
      throw new Error('Input is required');
    }

    for (const field of requiredFields) {
      if (!(field in input) || input[field] === undefined || input[field] === null) {
        throw new Error(`Required field '${field}' is missing or null`);
      }
    }
  }

  protected isInitialized(): boolean {
    return this.status !== AgentStatus.DISABLED;
  }

  protected ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(`Agent ${this.config.id} is not initialized`);
    }
  }
} 