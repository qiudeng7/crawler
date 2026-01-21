/**
 * 抖音 API CLI 工具
 *
 * 使用示例：
 *   # 列出所有可用方法
 *   npx tsx example/douyin/cli.ts
 *
 *   # 调用方法
 *   npx tsx example/douyin/cli.ts getAwemeDetail 7589820189332622611
 *   npx tsx example/douyin/cli.ts getUserAwemeList MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE 0 5
 *   npx tsx example/douyin/cli.ts searchAweme "风景" 0 5
 *   npx tsx example/douyin/cli.ts getAllUserAwemes MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE 10
 */

import dotenv from 'dotenv';
import { writeFile, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { DouyinApiClient } from '../../src/douyin/crawler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config();

const COOKIE = process.env.DOUYIN_COOKIE;

if (!COOKIE) {
  console.error('错误: .env 文件中未找到 DOUYIN_COOKIE');
  process.exit(1);
}

// 输出目录
const OUTPUT_DIR = join(__dirname, '../../output');
mkdirSync(OUTPUT_DIR, { recursive: true });

// 保存结果到文件
function saveResult(methodName: string, data: unknown, success: boolean = true): string {
  // 使用亚洲上海时区
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // UTC+8
  const timestamp = shanghaiTime.toISOString().replace(/[:.]/g, '-').slice(0, -5) + '-CN';
  const status = success ? 'successed' : 'failed';
  const filename = join(OUTPUT_DIR, `${methodName}-${timestamp}-${status}.json`);
  writeFile(filename, JSON.stringify(data, null, 2), 'utf-8', (err) => {
    if (err) console.error('保存文件失败:', err);
  });
  return filename;
}

// 保存错误到文件
function saveError(methodName: string, error: unknown): string {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // UTC+8
  const timestamp = shanghaiTime.toISOString().replace(/[:.]/g, '-').slice(0, -5) + '-CN';
  const filename = join(OUTPUT_DIR, `${methodName}-${timestamp}-failed.json`);

  let errorJson: Record<string, unknown>;
  if (error instanceof Error) {
    errorJson = {
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
    };

    // 如果是我们的自定义错误类，添加额外字段
    const err = error as unknown as { rawText?: string; url?: string; statusCode?: number; [key: string]: unknown };
    if (err.rawText !== undefined) {
      errorJson.rawText = err.rawText;
      errorJson.rawTextPreview = err.rawText.substring(0, 500);
      errorJson.rawTextLength = err.rawText.length;
    }
    if (err.url !== undefined) {
      errorJson.url = err.url;
    }
    if (err.statusCode !== undefined) {
      errorJson.statusCode = err.statusCode;
    }
  } else {
    errorJson = { error: String(error) };
  }

  writeFile(filename, JSON.stringify(errorJson, null, 2), 'utf-8', (err) => {
    if (err) console.error('保存文件失败:', err);
  });
  return filename;
}

// 随机延迟函数
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`⏱️  等待 ${delay} 秒...`);
  return new Promise(resolve => setTimeout(resolve, delay * 1000));
}

// DouyinApiClient 的方法签名映射
const METHOD_SIGNATURES: Record<string, string[]> = {
  getAwemeDetail: ['awemeId: string'],
  getUserAwemeList: ['secUserId: string', 'maxCursor?: number', 'count?: number'],
  getUserFavoriteList: ['secUserId: string', 'maxCursor?: number', 'count?: number'],
  getUserCollectionList: ['secUserId: string', 'maxCursor?: number', 'count?: number'],
  getMusicAwemeList: ['musicId: string', 'maxCursor?: number', 'count?: number'],
  getChallengeAwemeList: ['challengeId: string', 'maxCursor?: number', 'count?: number'],
  getMixAwemeList: ['mixId: string', 'maxCursor?: number', 'count?: number'],
  searchAweme: ['keyword: string', 'cursor?: number', 'count?: number', 'searchType?: number'],
  getUserFollowing: ['secUserId: string', 'maxTime?: number', 'count?: number'],
  getUserFollowers: ['secUserId: string', 'maxTime?: number', 'count?: number'],
  getAllUserAwemes: ['secUserId: string', 'limit?: number'],
  getAllMusicAwemes: ['musicId: string', 'limit?: number'],
  getAllUserFollowers: ['secUserId: string', 'limit?: number'],
};

// 展示所有可用方法
function listMethods() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 可用的 API 方法');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const [method, signature] of Object.entries(METHOD_SIGNATURES)) {
    console.log(`  ${method}`);
    console.log(`    参数: ${signature.join(', ')}`);
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 使用示例:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  npx tsx example/douyin/cli.ts _all');
  console.log('  npx tsx example/douyin/cli.ts getAwemeDetail 7589820189332622611');
  console.log('  npx tsx example/douyin/cli.ts getUserAwemeList MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE 0 5');
  console.log('  npx tsx example/douyin/cli.ts searchAweme "风景" 0 5');
  console.log('  npx tsx example/douyin/cli.ts getAllUserAwemes MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE 10');
  console.log('');
}

// 测试用例配置
const TEST_CASES: Array<{ method: string; args: string[]; description: string }> = [
  // 作品相关
  { method: 'getAwemeDetail', args: ['7589820189332622611'], description: '获取作品详情' },
  { method: 'getUserAwemeList', args: ['MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE', '0', '5'], description: '获取用户作品列表' },
  { method: 'searchAweme', args: ['风景', '0', '5'], description: '搜索作品' },

  // 用户相关
  { method: 'getUserFollowing', args: ['MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE', '0', '5'], description: '获取用户关注列表' },
  { method: 'getUserFollowers', args: ['MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE', '0', '5'], description: '获取用户粉丝列表' },
  // { method: 'getUserFavoriteList', args: ['MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE', '0', '5'], description: '获取用户喜欢列表' },
  // { method: 'getUserCollectionList', args: ['MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE', '0', '5'], description: '获取用户收藏列表' },

  // 音乐相关（需要音乐ID）
  // { method: 'getMusicAwemeList', args: ['MUSIC_ID', '0', '5'], description: '获取音乐作品列表' },
  // { method: 'getAllMusicAwemes', args: ['MUSIC_ID', '10'], description: '获取音乐所有作品' },

  // 话题相关（需要话题ID）
  // { method: 'getChallengeAwemeList', args: ['CHALLENGE_ID', '0', '5'], description: '获取话题作品列表' },

  // 合集相关（需要合集ID）
  // { method: 'getMixAwemeList', args: ['MIX_ID', '0', '5'], description: '获取合集作品列表' },

  // 批量获取（会获取大量数据，谨慎使用）
  // { method: 'getAllUserAwemes', args: ['MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE', '10'], description: '获取用户所有作品(限制10条)' },
  // { method: 'getAllUserFollowers', args: ['MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE', '10'], description: '获取用户所有粉丝(限制10条)' },
];

// 执行所有测试
async function runAllTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 执行所有测试用例');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 共 ${TEST_CASES.length} 个测试用例`);
  console.log(`⏱️  每次请求间隔 5-10 秒（随机）`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = new DouyinApiClient({
    cookie: COOKIE!,
    retry: true,
    maxRetries: 3,
  });

  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    const testNum = i + 1;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 测试 ${testNum}/${TEST_CASES.length}: ${testCase.description}`);
    console.log(`   方法: ${testCase.method}`);
    console.log(`   参数:`, testCase.args);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const result = await (client as any)[testCase.method](...testCase.args);
      const outputFile = saveResult(testCase.method, result, true);
      console.log(`✅ 测试 ${testNum} 成功`);
      console.log(`📁 结果已保存到: ${outputFile}`);
      passCount++;
    } catch (error) {
      const outputFile = saveError(testCase.method, error);
      console.error(`❌ 测试 ${testNum} 失败`);
      console.error(`📁 错误已保存到: ${outputFile}`);
      failCount++;
    }

    // 如果不是最后一个测试，添加随机延迟
    if (i < TEST_CASES.length - 1) {
      await randomDelay(5, 10);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 测试完成: ${passCount} 通过, ${failCount} 失败`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // 没有参数时，显示帮助信息
  if (args.length === 0) {
    listMethods();
    return;
  }

  // 特殊参数 _all：执行所有测试
  if (args[0] === '_all') {
    await runAllTests();
    return;
  }

  const methodName = args[0];
  const methodArgs = args.slice(1);

  // 检查方法是否存在
  if (!(methodName in METHOD_SIGNATURES)) {
    console.error(`❌ 错误: 方法 "${methodName}" 不存在`);
    console.log('\n运行以下命令查看所有可用方法:');
    console.log('  npx tsx example/douyin/cli.ts');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 调用方法: ${methodName}`);
  console.log(`📝 参数:`, methodArgs.length > 0 ? methodArgs : '(无)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = new DouyinApiClient({
    cookie: COOKIE!,
    retry: true,
    maxRetries: 3,
  });

  try {
    // 调用方法
    const result = await (client as any)[methodName](...methodArgs);

    // 保存结果
    const outputFile = saveResult(methodName, result, true);
    console.log(`✅ 调用成功`);
    console.log(`📁 结果已保存到: ${outputFile}`);

    console.log('\n✅ 完成');
  } catch (error) {
    const outputFile = saveError(methodName, error);
    console.error(`\n❌ 调用失败`);
    console.error(`📁 错误已保存到: ${outputFile}`);
    process.exit(1);
  }
}

main();
