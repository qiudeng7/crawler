/**
 * 抖音爬虫 - HTTP 请求层
 *
 * 封装 HTTP 请求、签名判断、Cookie 管理等底层逻辑
 */

import { signDetail, signReply } from './sign/js-runner.js';
import { JsonParseError, DouyinApiError, HttpError } from './errors.js';

// ============================================================================
// 类型定义
// ============================================================================

export interface RequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  body?: any;
  timeout?: number;
}

export interface RequestConfig {
  cookie: string;
  userAgent?: string;
  msToken?: string;
  webid?: string;
  retry?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export interface Response<T = any> {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  body: T;
}

// ============================================================================
// 需要签名的端点
// ============================================================================

const SIGNED_ENDPOINTS = [
  '/aweme/v1/web/aweme/detail/',
  '/aweme/v1/web/music/aweme/',
  '/aweme/v1/web/user/follower/list/',
] as const;

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'zh-CN,zh;q=0.9',
  'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'referer': 'https://www.douyin.com/',
};

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

const BASE_PARAMS = {
  device_platform: 'webapp',
  aid: '6383',
  channel: 'channel_pc_web',
} as const;

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 生成随机 msToken (120位)
 */
function generateMsToken(): string {
  const chars = 'ABCDEFGHIGKLMNOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz0123456789=';
  let result = '';
  for (let i = 0; i < 120; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * 生成随机 webid (19位数字)
 */
function generateWebid(): string {
  const min = 1000000000000000000n;
  const max = 9999999999999999999n;
  const random = BigInt(Math.floor(Math.random() * Number(max - min))) + min;
  return random.toString();
}

/**
 * 解析 Cookie 字符串为对象
 */
function parseCookie(cookieString: string): Map<string, string> {
  const cookies = new Map<string, string>();
  cookieString.split(';').forEach((pair) => {
    const [key, ...valueParts] = pair.trim().split('=');
    const value = valueParts.join('=');
    if (key && value) {
      cookies.set(key, value);
    }
  });
  return cookies;
}

/**
 * 将 Cookie Map 转换为字符串
 */
function stringifyCookie(cookies: Map<string, string>): string {
  return Array.from(cookies.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

/**
 * 构建查询字符串（与Python的quote()保持一致）
 */
function buildQueryString(params: Record<string, string | number>): string {
  // 按照 Python 的方式: "&".join([f"{k}={quote(str(v))}" for k, v in params.items()])
  // quote() 默认编码方式，与 encodeURIComponent 类似
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// HttpRequestClient 类
// ============================================================================

export class HttpRequestClient {
  private readonly cookieJar: Map<string, string>;
  private readonly userAgent: string;
  private readonly msToken: string;
  private readonly webid: string;
  private readonly retry: boolean;
  private readonly maxRetries: number;
  private readonly defaultTimeout: number;

  constructor(config: RequestConfig) {
    // 解析并管理 Cookie
    this.cookieJar = parseCookie(config.cookie);

    // 设置配置
    this.userAgent = config.userAgent || DEFAULT_USER_AGENT;
    this.retry = config.retry ?? true;
    this.maxRetries = config.maxRetries ?? 3;
    this.defaultTimeout = config.timeout ?? 30000;

    // 优先使用Cookie中的msToken，否则生成或使用配置的
    this.msToken = this.getCookie('msToken') || config.msToken || generateMsToken();
    this.webid = config.webid || generateWebid();

    // 确保必要的 Cookie 存在
    if (!this.cookieJar.has('msToken')) {
      this.cookieJar.set('msToken', this.msToken);
    }
    if (!this.cookieJar.has('ttwid')) {
      this.cookieJar.set('ttwid', '1%7C');
    }
  }

  /**
   * 判断端点是否需要签名
   */
  private needsSignature(endpoint: string): boolean {
    return SIGNED_ENDPOINTS.some((signed) => endpoint.includes(signed));
  }

  /**
   * 为请求生成签名
   */
  private signRequest(
    endpoint: string,
    params: Record<string, string | number>
  ): string | null {
    if (!this.needsSignature(endpoint)) {
      return null;
    }

    const queryString = buildQueryString(params);

    // 根据端点类型选择不同的签名函数
    if (endpoint.includes('/user/follower/list/')) {
      return signReply(queryString, this.userAgent);
    }
    return signDetail(queryString, this.userAgent);
  }

  /**
   * 构建请求参数（添加基础参数和签名）
   *
   * 参数顺序很重要：业务参数 → 基础参数 → 其他参数
   */
  private buildParams(
    endpoint: string,
    customParams: Record<string, string | number> = {}
  ): Record<string, string> {
    // 按照正确的顺序构建参数
    const params: Record<string, string> = {};

    // 1. 先添加业务参数（customParams）
    for (const [key, value] of Object.entries(customParams)) {
      params[key] = String(value);
    }

    // 2. 然后添加基础参数
    Object.assign(params, BASE_PARAMS);

    // 3. 添加其他固定参数
    params['webid'] = this.webid;
    params['msToken'] = this.msToken;
    // 设备指纹参数
    params['screen_width'] = this.getCookie('dy_swidth') || '2560';
    params['screen_height'] = this.getCookie('dy_sheight') || '1440';
    params['cpu_core_num'] = this.getCookie('device_web_cpu_core') || '24';
    params['device_memory'] = this.getCookie('device_web_memory_size') || '8';
    // 设备验证参数（从Cookie获取s_v_web_id，如果存在则添加）
    const sVWebId = this.getCookie('s_v_web_id');
    if (sVWebId) {
      params['verifyFp'] = sVWebId;
      params['fp'] = sVWebId;
    }

    // 4. 添加签名（如果需要）
    const signature = this.signRequest(endpoint, params);
    if (signature) {
      params.a_bogus = signature;
    }

    return params;
  }

  /**
   * 构建请求头
   */
  private buildHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      ...DEFAULT_HEADERS,
      'User-Agent': this.userAgent,
      'cookie': stringifyCookie(this.cookieJar),
      ...customHeaders,
    };
  }

  /**
   * 更新 Cookie（从响应的 Set-Cookie 头）
   */
  private updateCookies(setCookieHeaders: string[]): void {
    for (const setCookie of setCookieHeaders) {
      const [cookiePair] = setCookie.split(';');
      const [key, ...valueParts] = cookiePair.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        this.cookieJar.set(key, value);
      }
    }
  }

  /**
   * 发送 HTTP 请求
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<Response<T>> {
    const {
      method = 'GET',
      headers = {},
      params = {},
      body,
      timeout = this.defaultTimeout,
    } = options;

    const baseUrl = 'https://www.douyin.com';
    const fullUrl = new URL(endpoint, baseUrl);

    // 构建请求参数和头
    const requestParams = this.buildParams(endpoint, params);
    const requestHeaders = this.buildHeaders(headers);

    // 添加查询参数
    if (Object.keys(requestParams).length > 0) {
      fullUrl.search = buildQueryString(requestParams);
    }

    // 构建请求配置
    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // 执行请求（带重试）
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= (this.retry ? this.maxRetries : 0); attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // 调试日志
        if (this.needsSignature(endpoint)) {
          console.log(`[DEBUG] 请求URL: ${fullUrl.toString()}`);
        }

        const response = await fetch(fullUrl.toString(), {
          ...requestInit,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 调试日志
        if (this.needsSignature(endpoint)) {
          console.log(`[DEBUG] 响应状态: ${response.status}`);
        }

        // 提取响应头
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // 更新 Cookie
        const setCookieHeaders = response.headers.getSetCookie?.() || [];
        if (setCookieHeaders.length > 0) {
          this.updateCookies(setCookieHeaders);
        }

        // 获取响应文本（用于调试）
        const responseText = await response.text();

        // 调试：如果是签名API，打印响应的前200个字符
        if (this.needsSignature(endpoint) && responseText.length < 500) {
          console.log(`[DEBUG] 响应内容长度: ${responseText.length}`);
          console.log(`[DEBUG] 响应内容: ${responseText.substring(0, 200)}`);
        }

        // 解析响应体
        let responseBody: {
          status_code: number;
          status_msg?: string;
          [key: string]: any;
        };

        try {
          responseBody = JSON.parse(responseText);
        } catch (parseError) {
          // JSON 解析失败，抛出详细的错误信息
          throw new JsonParseError(
            `Failed to parse JSON response from ${endpoint}`,
            responseText,
            fullUrl.toString(),
            response.status
          );
        }

        // 检查业务状态码
        if (responseBody.status_code !== 0) {
          throw new DouyinApiError(
            `API Error ${responseBody.status_code}: ${responseBody.status_msg || 'Unknown error'}`,
            responseBody.status_code,
            responseBody.status_msg,
            endpoint,
            params
          );
        }

        return {
          statusCode: response.status,
          statusMessage: response.statusText,
          headers: responseHeaders,
          body: responseBody as T,
        };
      } catch (error) {
        // 记录详细的错误信息
        const errorInfo = {
          endpoint,
          method,
          attempt: attempt + 1,
          maxRetries: this.maxRetries,
          url: fullUrl.toString(),
          error: error instanceof Error ? {
            name: error.constructor.name,
            message: error.message,
          } : String(error),
        };

        // 如果不是我们自定义的错误，包装成 HttpError
        if (!(error instanceof JsonParseError || error instanceof DouyinApiError)) {
          console.error(
            `[Request Error] Attempt ${attempt + 1}/${this.maxRetries}`,
            JSON.stringify(errorInfo, null, 2)
          );
          lastError = new HttpError(
            error instanceof Error ? error.message : String(error),
            fullUrl.toString(),
            method,
            undefined,
            attempt + 1,
            error instanceof Error ? error : undefined
          );
        } else {
          lastError = error as Error;
        }

        // 如果是最后一次尝试或不需要重试，抛出错误
        if (!this.retry || attempt === this.maxRetries) {
          break;
        }

        // 等待一段时间后重试
        await delay(1000 * (attempt + 1));
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * GET 请求
   */
  async get<T = any>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const response = await this.request<T>(endpoint, { method: 'GET', params });
    return response.body;
  }

  /**
   * POST 请求
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    params?: Record<string, string | number>
  ): Promise<T> {
    const response = await this.request<T>(endpoint, { method: 'POST', body, params });
    return response.body;
  }

  /**
   * 获取当前的 Cookie 字符串
   */
  getCookieString(): string {
    return stringifyCookie(this.cookieJar);
  }

  /**
   * 获取特定的 Cookie 值
   */
  getCookie(name: string): string | undefined {
    return this.cookieJar.get(name);
  }

  /**
   * 设置 Cookie
   */
  setCookie(name: string, value: string): void {
    this.cookieJar.set(name, value);
  }

  /**
   * 获取 webid
   */
  getWebid(): string {
    return this.webid;
  }

  /**
   * 获取 msToken
   */
  getMsToken(): string {
    return this.msToken;
  }
}

// ============================================================================
// 导出
// ============================================================================

export default HttpRequestClient;
