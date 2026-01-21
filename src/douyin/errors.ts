/**
 * 抖音 API 统一错误定义
 */

/**
 * JSON 解析错误
 */
export class JsonParseError extends Error {
  readonly name = 'JsonParseError';

  constructor(
    message: string,
    public readonly rawText: string,
    public readonly url: string,
    public readonly statusCode?: number
  ) {
    super(message);
    Error.captureStackTrace(this, JsonParseError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      url: this.url,
      statusCode: this.statusCode,
      rawTextPreview: this.rawText.substring(0, 500),
      rawTextLength: this.rawText.length,
    };
  }
}

/**
 * 抖音 API 业务错误
 */
export class DouyinApiError extends Error {
  readonly name = 'DouyinApiError';

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly statusMsg?: string,
    public readonly endpoint?: string,
    public readonly params?: Record<string, any>
  ) {
    super(message);
    Error.captureStackTrace(this, DouyinApiError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      statusMsg: this.statusMsg,
      endpoint: this.endpoint,
      params: this.params,
    };
  }
}

/**
 * HTTP 请求错误（网络错误、超时等）
 */
export class HttpError extends Error {
  readonly name = 'HttpError';

  constructor(
    message: string,
    public readonly url: string,
    public readonly method: string,
    public readonly statusCode?: number,
    public readonly attempt?: number,
    public readonly cause?: Error
  ) {
    super(message);
    Error.captureStackTrace(this, HttpError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      url: this.url,
      method: this.method,
      statusCode: this.statusCode,
      attempt: this.attempt,
      cause: this.cause?.message,
    };
  }
}

/**
 * Worker 处理错误（包装业务层错误）
 */
export class WorkerError extends Error {
  readonly name = 'WorkerError';

  constructor(
    message: string,
    public readonly correlationId: string,
    public readonly method: string,
    public readonly params: unknown[],
    public readonly cause?: Error
  ) {
    super(message);
    Error.captureStackTrace(this, WorkerError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      correlationId: this.correlationId,
      method: this.method,
      params: this.params,
      cause: this.cause?.message,
      causeName: this.cause?.constructor.name,
    };
  }
}

/**
 * 错误序列化辅助函数
 */
export function serializeError(error: unknown): string {
  if (error instanceof JsonParseError || error instanceof DouyinApiError || error instanceof HttpError || error instanceof WorkerError) {
    return JSON.stringify(error.toJSON(), null, 2);
  }

  if (error instanceof Error) {
    return JSON.stringify({
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
    }, null, 2);
  }

  return String(error);
}
