/**
 * BullMQ 测试脚本
 *
 * 向队列添加任务并监听 Worker 处理结果
 */

import { Queue, QueueEvents } from 'bullmq';
import { createRequire } from 'module';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// CommonJS import for ioredis
const require = createRequire(import.meta.url);
const Redis = require('ioredis');

// ============================================================================
// Redis 连接配置
// ============================================================================

const redisConfig = {
  host: process.env.redis_host || 'localhost',
  port: parseInt(process.env.redis_port || '6379', 10),
  maxRetriesPerRequest: null,
};

const connection = new Redis(redisConfig);

// ============================================================================
// Queue 名称常量
// ============================================================================

const QUEUE_NAMES = {
  AWEME_DETAIL: 'douyin-aweme-detail',
  USER_AWEME_LIST: 'douyin-user-aweme-list',
  USER_FAVORITE_LIST: 'douyin-user-favorite-list',
  USER_COLLECTION_LIST: 'douyin-user-collection-list',
  MUSIC_AWEME_LIST: 'douyin-music-aweme-list',
  CHALLENGE_AWEME_LIST: 'douyin-challenge-aweme-list',
  MIX_AWEME_LIST: 'douyin-mix-aweme-list',
  SEARCH_AWEME: 'douyin-search-aweme',
  USER_FOLLOWING: 'douyin-user-following',
  USER_FOLLOWERS: 'douyin-user-followers',
  ALL_USER_AWEMES: 'douyin-all-user-awemes',
  ALL_MUSIC_AWEMES: 'douyin-all-music-awemes',
  ALL_USER_FOLLOWERS: 'douyin-all-user-followers',
} as const;

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 等待任务完成
 */
function waitForJob(
  queueEvents: QueueEvents,
  jobId: string,
  timeout: number = 30000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      queueEvents.close();
      reject(new Error(`任务 ${jobId} 超时`));
    }, timeout);

    queueEvents.on('completed', (args: any) => {
      if (args.jobId === jobId) {
        clearTimeout(timer);
        queueEvents.close();
        resolve(args.returnvalue);
      }
    });

    queueEvents.on('failed', (args: any) => {
      if (args.jobId === jobId) {
        clearTimeout(timer);
        queueEvents.close();
        reject(new Error(args.failedReason));
      }
    });

    queueEvents.on('waiting', (args: any) => {
      if (args.jobId === jobId) {
        console.log(`任务 ${jobId} 等待中...`);
      }
    });
  });
}

// ============================================================================
// 测试函数
// ============================================================================

/**
 * 测试添加单个作品详情任务
 */
async function testAwemeDetail() {
  console.log('\n========== 测试: 获取作品详情 ==========');

  const queue = new Queue(QUEUE_NAMES.AWEME_DETAIL, { connection });
  const queueEvents = new QueueEvents(QUEUE_NAMES.AWEME_DETAIL, { connection });

  // 添加任务
  const job = await queue.add('get-aweme-detail', {
    awemeId: '7445515487635288844', // 示例作品ID
  });

  console.log(`任务已添加: ${job.id}`);

  // 等待任务完成
  const result = await waitForJob(queueEvents, job.id!);
  console.log('任务结果:', JSON.stringify(result, null, 2));

  await queue.close();
  return result;
}

/**
 * 测试添加用户作品列表任务
 */
async function testUserAwemeList() {
  console.log('\n========== 测试: 获取用户作品列表 ==========');

  const queue = new Queue(QUEUE_NAMES.USER_AWEME_LIST, { connection });
  const queueEvents = new QueueEvents(QUEUE_NAMES.USER_AWEME_LIST, { connection });

  const job = await queue.add('get-user-aweme-list', {
    secUserId: 'MS4wLjABAAAA8VmLlOEXxD2euZlFchVlwue-hIPEm18WLObEBnG2OTk', // 示例用户ID
    maxCursor: 0,
    count: 5,
  });

  console.log(`任务已添加: ${job.id}`);

  const result = await waitForJob(queueEvents, job.id!);
  console.log('任务结果:', JSON.stringify(result, null, 2));

  await queue.close();
  return result;
}

/**
 * 测试搜索作品
 */
async function testSearchAweme() {
  console.log('\n========== 测试: 搜索作品 ==========');

  const queue = new Queue(QUEUE_NAMES.SEARCH_AWEME, { connection });
  const queueEvents = new QueueEvents(QUEUE_NAMES.SEARCH_AWEME, { connection });

  const job = await queue.add('search-aweme', {
    keyword: '猫咪',
    offset: 0,
    count: 5,
    searchType: 0,
  });

  console.log(`任务已添加: ${job.id}`);

  const result = await waitForJob(queueEvents, job.id!);
  console.log('任务结果:', JSON.stringify(result, null, 2));

  await queue.close();
  return result;
}

/**
 * 批量添加多个任务
 */
async function testBatchJobs() {
  console.log('\n========== 测试: 批量添加任务 ==========');

  const queue = new Queue(QUEUE_NAMES.AWEME_DETAIL, { connection });
  const queueEvents = new QueueEvents(QUEUE_NAMES.AWEME_DETAIL, { connection });

  const awemeIds = [
    '7445515487635288844',
    '7445456789123456789',
    '7445345678901234567',
  ];

  const jobs = awemeIds.map((awemeId) => ({
    name: 'get-aweme-detail',
    data: {
      awemeId,
    },
  }));

  await queue.addBulk(jobs);
  console.log(`已批量添加 ${jobs.length} 个任务`);

  // 监听所有任务完成
  let completedCount = 0;
  const results: any[] = [];

  queueEvents.on('completed', (args: any) => {
    completedCount++;
    console.log(`任务 ${args.jobId} 完成 (${completedCount}/${jobs.length})`);
    results.push(args.returnvalue);
  });

  queueEvents.on('failed', (args: any) => {
    console.error(`任务 ${args.jobId} 失败: ${args.failedReason}`);
  });

  // 等待所有任务完成
  await new Promise<void>((resolve) => {
    const checkInterval = setInterval(() => {
      if (completedCount >= jobs.length) {
        clearInterval(checkInterval);
        queueEvents.close();
        resolve();
      }
    }, 500);

    // 超时保护
    setTimeout(() => {
      clearInterval(checkInterval);
      queueEvents.close();
      resolve();
    }, 60000);
  });

  await queue.close();
  console.log(`所有任务完成，共处理 ${results.length} 个`);
}

/**
 * 监听队列状态
 */
async function monitorQueue(queueName: string, duration: number = 30000) {
  console.log(`\n========== 监控队列: ${queueName} ==========`);

  const queue = new Queue(queueName, { connection });
  const queueEvents = new QueueEvents(queueName, { connection });

  // 获取队列状态
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
  ]);

  console.log(`等待中: ${waiting.length}`);
  console.log(`处理中: ${active.length}`);
  console.log(`已完成: ${completed.length}`);
  console.log(`失败: ${failed.length}`);

  // 监听事件
  queueEvents.on('waiting', (args: any) => {
    console.log(`[事件] 任务 ${args.jobId} 进入等待队列`);
  });

  queueEvents.on('active', (args: any) => {
    console.log(`[事件] 任务 ${args.jobId} 开始处理`);
  });

  queueEvents.on('completed', (args: any) => {
    console.log(`[事件] 任务 ${args.jobId} 完成`);
  });

  queueEvents.on('failed', (args: any) => {
    console.error(`[事件] 任务 ${args.jobId} 失败: ${args.failedReason}`);
  });

  // 定期打印状态
  const interval = setInterval(async () => {
    const stats = await queue.getJobCounts();
    console.log('[队列状态]', stats);
  }, 5000);

  setTimeout(() => {
    clearInterval(interval);
    queueEvents.close();
    queue.close();
    console.log('监控结束');
  }, duration);
}

/**
 * 清空队列
 */
async function cleanQueue(queueName: string) {
  console.log(`\n========== 清空队列: ${queueName} ==========`);

  const queue = new Queue(queueName, { connection });

  await queue.drain();
  console.log(`队列 ${queueName} 已清空`);

  await queue.close();
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  try {
    // 检查环境变量
    if (!process.env.douyin_cookie) {
      console.error('错误: 请在 .env 文件中设置 douyin_cookie 环境变量');
      process.exit(1);
    }

    // 选择要运行的测试
    const testType = process.argv[2] || 'detail';

    switch (testType) {
      case 'detail':
        await testAwemeDetail();
        break;
      case 'user':
        await testUserAwemeList();
        break;
      case 'search':
        await testSearchAweme();
        break;
      case 'batch':
        await testBatchJobs();
        break;
      case 'clean':
        await cleanQueue(QUEUE_NAMES.AWEME_DETAIL);
        await cleanQueue(QUEUE_NAMES.USER_AWEME_LIST);
        break;
      case 'monitor':
        await monitorQueue(QUEUE_NAMES.AWEME_DETAIL);
        break;
      case 'all':
        await testAwemeDetail();
        await testUserAwemeList();
        await testSearchAweme();
        break;
      default:
        console.log(`
使用方法: pnpm tsx example/test-mq.ts [test-type]

测试类型:
  detail   - 测试获取作品详情 (默认)
  user     - 测试获取用户作品列表
  search   - 测试搜索作品
  batch    - 测试批量添加任务
  monitor  - 监控队列状态
  clean    - 清空队列
  all      - 运行所有测试

示例:
  pnpm tsx example/test-mq.ts detail
  pnpm tsx example/test-mq.ts user
  pnpm tsx example/test-mq.ts search
        `);
    }
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  } finally {
    await connection.quit();
  }
}

// 运行测试
main().catch(console.error);
