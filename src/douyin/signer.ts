/**
 * 抖音签名模块
 * 用于生成抖音API请求所需的 a_bogus 签名参数
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * 抖音签名类
 */
export class DouyinSigner {
  private signModule: any;

  constructor() {
    // 动态加载 JavaScript 签名模块
    const signScriptPath = path.join(__dirname, 'douyin.js');
    const signScriptContent = fs.readFileSync(signScriptPath, 'utf-8');
    
    // 在 Node.js 环境中执行 JavaScript 代码
    // 使用 vm 模块或直接 eval 来执行（生产环境应使用 vm2 或类似的安全沙箱）
    const vm = require('vm');
    const context = vm.createContext({
      console: console,
      require: require,
      module: { exports: {} }
    });
    
    vm.runInContext(signScriptContent, context);
    this.signModule = context.module.exports;
  }

  /**
   * 生成 web_id
   * 参考 MediaCrawler 中的 get_web_id() 实现
   */
  generateWebId(): string {
    const e = (t: number | null) => {
      if (t !== null) {
        return String(t ^ (Math.floor(Math.random() * 16) >> (t / 4)));
      } else {
        return String(Math.floor(Math.random() * 1e7)) + '-' +
               String(Math.floor(Math.random() * 1e3)) + '-' +
               String(Math.floor(Math.random() * 4e3)) + '-' +
               String(Math.floor(Math.random() * 8e3)) + '-' +
               String(Math.floor(Math.random() * 1e11));
      }
    };

    const webIdTemplate = e(null);
    return webIdTemplate.split('').map((char, index) => {
      return e(['0', '1', '8'].includes(char) ? parseInt(char) : null);
    }).join('').replace(/-/g, '').substring(0, 19);
  }

  /**
   * 生成 a_bogus 签名参数
   * @param params URL 查询参数字符串
   * @param userAgent 用户代理字符串
   * @returns a_bogus 签名值
   */
  generateABogus(params: string, userAgent: string): string {
    try {
      // 调用 JavaScript 签名函数
      if (this.signModule && this.signModule.sign_datail) {
        return this.signModule.sign_datail(params, userAgent);
      }
      throw new Error('签名模块未正确加载');
    } catch (error) {
      console.error('生成 a_bogus 签名失败:', error);
      throw error;
    }
  }

  /**
   * 生成评论相关的签名
   * @param params URL 查询参数字符串
   * @param userAgent 用户代理字符串
   * @returns a_bogus 签名值
   */
  generateReplyABogus(params: string, userAgent: string): string {
    try {
      // 调用 JavaScript 签名函数
      if (this.signModule && this.signModule.sign_reply) {
        return this.signModule.sign_reply(params, userAgent);
      }
      throw new Error('签名模块未正确加载');
    } catch (error) {
      console.error('生成评论签名失败:', error);
      throw error;
    }
  }

  /**
   * 生成 msToken（模拟）
   * 注意：实际 msToken 需要从浏览器 localStorage 获取
   * 这里生成一个模拟值用于测试
   */
  generateMsToken(): string {
    // 生成一个64位的十六进制字符串
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

// 导出单例实例
export const signer = new DouyinSigner();