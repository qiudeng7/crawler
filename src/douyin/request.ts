/**
 * 抖音爬虫 - HTTP 请求层
 *
 * 封装 HTTP 请求、签名判断、Cookie 管理等底层逻辑
 */

import { signDetail, signReply } from './sign/index.js';

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
 * 构建查询字符串
 */
function buildQueryString(params: Record<string, string | number>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }
  return searchParams.toString();
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

    // 生成或使用提供的 token
    this.msToken = config.msToken || generateMsToken();
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
   */
  private buildParams(
    endpoint: string,
    customParams: Record<string, string | number> = {}
  ): Record<string, string> {
    const params: Record<string, string> = {
      ...BASE_PARAMS,
      webid: this.webid,
      msToken: this.msToken,
      ...Object.fromEntries(
        Object.entries(customParams).map(([k, v]) => [k, String(v)])
      ),
    };

    // 添加签名（如果需要）
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

        const response = await fetch(fullUrl.toString(), {
          ...requestInit,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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

        // 解析响应体
        const responseBody = (await response.json()) as {
          status_code: number;
          status_msg?: string;
          [key: string]: any;
        };

        // 检查业务状态码
        if (responseBody.status_code !== 0) {
          throw new Error(
            `API Error ${responseBody.status_code}: ${responseBody.status_msg || 'Unknown error'}`
          );
        }

        return {
          statusCode: response.status,
          statusMessage: response.statusText,
          headers: responseHeaders,
          body: responseBody as T,
        };
      } catch (error) {
        lastError = error as Error;

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
