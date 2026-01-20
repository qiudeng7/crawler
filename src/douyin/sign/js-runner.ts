/**
 * 抖音签名模块 - 使用原始JS文件（简化版）
 *
 * 完全照搬Python的exejs运行方式
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// 加载原始的JS签名脚本
const jsFilePath = join(__dirname, 'sign.js');
const jsCode = readFileSync(jsFilePath, 'utf-8');

// 使用 Function 构造函数执行代码（类似 Python 的 exejs）
// 创建一个隔离的执行环境
function executeJsCode(): {
  sign_datail: (params: string, userAgent: string) => string;
  sign_reply: (params: string, userAgent: string) => string;
} {
  // 创建一个执行上下文
  const context: any = {
    console,
    // 提供所有必要的全局对象
    encodeURIComponent,
    decodeURIComponent,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    String,
    Number,
    Array,
    Object,
    Math,
    Date,
    JSON,
    Error,
    TypeError,
    RangeError,
    ReferenceError,
    SyntaxError,
    // 类型化数组
    Uint8Array,
    Int8Array,
    Uint16Array,
    Int32Array,
    BigUint64Array,
    Uint8ClampedArray,
    Float32Array,
    Float64Array,
    DataView,
  };

  // 使用 Function 构造函数执行代码，并传入上下文
  const fn = new Function(
    'console',
    'encodeURIComponent',
    'decodeURIComponent',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'String',
    'Number',
    'Array',
    'Object',
    'Math',
    'Date',
    'JSON',
    'Error',
    'TypeError',
    'RangeError',
    'ReferenceError',
    'SyntaxError',
    'Uint8Array',
    'Int8Array',
    'Uint16Array',
    'Int32Array',
    'BigUint64Array',
    'Uint8ClampedArray',
    'Float32Array',
    'Float64Array',
    'DataView',
    `
      ${jsCode}

      // 返回导出的函数
      return {
        sign_datail: typeof sign_datail !== 'undefined' ? sign_datail : null,
        sign_reply: typeof sign_reply !== 'undefined' ? sign_reply : null,
      };
    `
  );

  // 执行函数并传入上下文
  return fn(
    context.console,
    context.encodeURIComponent,
    context.decodeURIComponent,
    context.parseInt,
    context.parseFloat,
    context.isNaN,
    context.isFinite,
    context.String,
    context.Number,
    context.Array,
    context.Object,
    context.Math,
    context.Date,
    context.JSON,
    context.Error,
    context.TypeError,
    context.RangeError,
    context.ReferenceError,
    context.SyntaxError,
    context.Uint8Array,
    context.Int8Array,
    context.Uint16Array,
    context.Int32Array,
    context.BigUint64Array,
    context.Uint8ClampedArray,
    context.Float32Array,
    context.Float64Array,
    context.DataView
  );
}

// 执行并提取函数
const { sign_datail, sign_reply } = executeJsCode();

// ============================================================================
// 导出的签名函数
// ============================================================================

/**
 * 生成作品详情接口签名
 *
 * @param params - URL查询参数（已编码的字符串）
 * @param userAgent - User-Agent字符串
 * @returns a_bogus 签名
 */
export function signDetail(params: string, userAgent: string): string {
  return sign_datail(params, userAgent);
}

/**
 * 生成评论接口签名
 *
 * @param params - URL查询参数（已编码的字符串）
 * @param userAgent - User-Agent字符串
 * @returns a_bogus 签名
 */
export function signReply(params: string, userAgent: string): string {
  return sign_reply(params, userAgent);
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  signDetail,
  signReply,
};
