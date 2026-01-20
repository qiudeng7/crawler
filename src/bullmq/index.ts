/**
 * BullMQ Workers - 抖音爬虫任务处理器
 *
 * 为 DouyinApiClient 的所有接口注册 BullMQ Workers
 */

import { Worker, Job } from 'bullmq';
import { DouyinApiClient } from '../douyin/crawler.js';
import type { CrawlerConfig } from '../douyin/types.js';
import dotenv from 'dotenv';
import { createRequire } from 'module';

// 加载环境变量
dotenv.config();

// CommonJS import for ioredis (using createRequire for ESM compatibility)
// eslint-disable-next-line @typescript-eslint/no-var-requires
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

// 创建 Redis 连接
const connection = new Redis(redisConfig);

// ============================================================================
// Queue 名称常量
// ============================================================================

export const QUEUE_NAMES = {
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
// 创建 DouyinApiClient 实例的工厂函数
// ============================================================================

function createClient(config?: CrawlerConfig): DouyinApiClient {
  if (!config) {
    const cookie = process.env.douyin_cookie;
    if (!cookie) {
      throw new Error('douyin_cookie environment variable is required');
    }
    config = { cookie };
  }
  return new DouyinApiClient(config);
}

// ============================================================================
// Worker 处理器函数
// ============================================================================

const processors = {
  /**
   * 获取单个作品详情
   */
  [QUEUE_NAMES.AWEME_DETAIL]: async (job: Job) => {
    const { awemeId, config } = job.data;
    const client = createClient(config);
    return await client.getAwemeDetail(awemeId);
  },

  /**
   * 获取用户作品列表
   */
  [QUEUE_NAMES.USER_AWEME_LIST]: async (job: Job) => {
    const { secUserId, maxCursor = 0, count = 18, config } = job.data;
    const client = createClient(config);
    return await client.getUserAwemeList(secUserId, maxCursor, count);
  },

  /**
   * 获取用户喜欢列表
   */
  [QUEUE_NAMES.USER_FAVORITE_LIST]: async (job: Job) => {
    const { secUserId, maxCursor = 0, count = 18, config } = job.data;
    const client = createClient(config);
    return await client.getUserFavoriteList(secUserId, maxCursor, count);
  },

  /**
   * 获取用户收藏列表
   */
  [QUEUE_NAMES.USER_COLLECTION_LIST]: async (job: Job) => {
    const { secUserId, maxCursor = 0, count = 18, config } = job.data;
    const client = createClient(config);
    return await client.getUserCollectionList(secUserId, maxCursor, count);
  },

  /**
   * 获取音乐作品列表
   */
  [QUEUE_NAMES.MUSIC_AWEME_LIST]: async (job: Job) => {
    const { musicId, maxCursor = 0, count = 18, config } = job.data;
    const client = createClient(config);
    return await client.getMusicAwemeList(musicId, maxCursor, count);
  },

  /**
   * 获取话题作品列表
   */
  [QUEUE_NAMES.CHALLENGE_AWEME_LIST]: async (job: Job) => {
    const { challengeId, maxCursor = 0, count = 18, config } = job.data;
    const client = createClient(config);
    return await client.getChallengeAwemeList(challengeId, maxCursor, count);
  },

  /**
   * 获取合集作品列表
   */
  [QUEUE_NAMES.MIX_AWEME_LIST]: async (job: Job) => {
    const { mixId, maxCursor = 0, count = 18, config } = job.data;
    const client = createClient(config);
    return await client.getMixAwemeList(mixId, maxCursor, count);
  },

  /**
   * 搜索作品
   */
  [QUEUE_NAMES.SEARCH_AWEME]: async (job: Job) => {
    const { keyword, offset = 0, count = 10, searchType = 0, config } = job.data;
    const client = createClient(config);
    return await client.searchAweme(keyword, offset, count, searchType);
  },

  /**
   * 获取用户关注列表
   */
  [QUEUE_NAMES.USER_FOLLOWING]: async (job: Job) => {
    const { secUserId, maxTime = 0, count = 20, config } = job.data;
    const client = createClient(config);
    return await client.getUserFollowing(secUserId, maxTime, count);
  },

  /**
   * 获取用户粉丝列表
   */
  [QUEUE_NAMES.USER_FOLLOWERS]: async (job: Job) => {
    const { secUserId, maxTime = 0, count = 20, config } = job.data;
    const client = createClient(config);
    return await client.getUserFollowers(secUserId, maxTime, count);
  },

  /**
   * 获取用户所有作品
   */
  [QUEUE_NAMES.ALL_USER_AWEMES]: async (job: Job) => {
    const { secUserId, limit = 0, config } = job.data;
    const client = createClient(config);
    return await client.getAllUserAwemes(secUserId, limit);
  },

  /**
   * 获取音乐所有作品
   */
  [QUEUE_NAMES.ALL_MUSIC_AWEMES]: async (job: Job) => {
    const { musicId, limit = 0, config } = job.data;
    const client = createClient(config);
    return await client.getAllMusicAwemes(musicId, limit);
  },

  /**
   * 获取用户所有粉丝
   */
  [QUEUE_NAMES.ALL_USER_FOLLOWERS]: async (job: Job) => {
    const { secUserId, limit = 0, config } = job.data;
    const client = createClient(config);
    return await client.getAllUserFollowers(secUserId, limit);
  },
};

// ============================================================================
// Worker 类
// ============================================================================

export class DouyinWorkers {
  private readonly workers: Worker[] = [];

  /**
   * 创建所有 Workers
   */
  async createAll(): Promise<void> {
    for (const [queueName, processor] of Object.entries(processors)) {
      const worker = new Worker(queueName, processor, {
        connection,
        concurrency: 1,
      });

      worker.on('completed', (job) => {
        console.log(`[Worker] ${queueName} completed job ${job.id}`);
      });

      worker.on('failed', (job, err) => {
        console.error(`[Worker] ${queueName} failed job ${job?.id}:`, err.message);
      });

      this.workers.push(worker);
    }
  }

  /**
   * 关闭所有 Workers
   */
  async close(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    await connection.quit();
  }
}

// ============================================================================
// 导出
// ============================================================================
export default DouyinWorkers;

console.log("worker started")