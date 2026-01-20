import vm from 'vm';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 抖音签名服务
 * 使用 vm 模块执行签名脚本生成 a_bogus
 * 
 * @example
 * ```typescript
 * import { getSignService } from './sign';
 * 
 * const signService = getSignService();
 * const sign = signService.signDetail(params, userAgent);
 * ```
 */
export class DouyinSignService {
  private script: string;
  private context: vm.Context;

  constructor() {
    // 加载签名脚本
    this.script = readFileSync(
      join(__dirname, 'assets/douyin.js'),
      'utf-8'
    );
    
    // 创建并初始化上下文
    this.context = vm.createContext({
      Date,
      Math,
      console
    });
    
    // 执行脚本以初始化函数
    vm.runInContext(this.script, this.context);
  }

  /**
   * 生成签名
   * @param params - URL 查询参数字符串
   * @param userAgent - User-Agent 字符串
   * @param type - 签名类型：'detail' 或 'reply'
   * @returns 签名字符串（a_bogus）
   */
  sign(params: string, userAgent: string, type: 'detail' | 'reply'): string {
    const methodName = type === 'detail' ? 'sign_datail' : 'sign_reply';
    
    if (!this.context[methodName]) {
      throw new Error(`签名方法 ${methodName} 未找到`);
    }

    return this.context[methodName](params, userAgent);
  }

  /**
   * 生成详情页签名
   * @param params - URL 查询参数字符串
   * @param userAgent - User-Agent 字符串
   * @returns 签名字符串
   */
  signDetail(params: string, userAgent: string): string {
    return this.sign(params, userAgent, 'detail');
  }

  /**
   * 生成评论回复签名
   * @param params - URL 查询参数字符串
   * @param userAgent - User-Agent 字符串
   * @returns 签名字符串
   */
  signReply(params: string, userAgent: string): string {
    return this.sign(params, userAgent, 'reply');
  }
}

// 导出单例实例
let instance: DouyinSignService | null = null;

/**
 * 获取签名服务单例
 * 
 * @example
 * ```typescript
 * const signService = getSignService();
 * const sign = signService.signDetail(params, userAgent);
 * ```
 */
export function getSignService(): DouyinSignService {
  if (!instance) {
    instance = new DouyinSignService();
  }
  return instance;
}