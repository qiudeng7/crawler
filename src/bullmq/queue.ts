/**
 * BullMQ 队列模块
 * 用于创建和管理爬虫任务队列
 */

import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { JobType, JobData, JobResult } from './jobs';

/**
 * 创建队列连接
 */
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

/**
 * 爬虫队列
 */
export const crawlerQueue = new Queue<JobData, JobResult>('crawler', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,  // 保留最近100个完成的任务
    removeOnFail: 500,     // 保留最近500个失败的任务
    attempts: 3,            // 失败后重试3次
    backoff: {
      type: 'exponential',
      delay: 2000,        // 初始延迟2秒
    },
  },
});

/**
 * 添加搜索任务到队列
 * @param data 搜索参数
 * @returns Job 对象
 */
export async function addSearchJob(data: JobData) {
  const job = await crawlerQueue.add(JobType.SEARCH, data, {
    jobId: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  });
  console.log(`添加搜索任务: ${job.id}, 关键词: ${(data as any).keyword}`);
  return job;
}

/**
 * 添加视频详情任务到队列
 * @param awemeId 视频ID
 * @returns Job 对象
 */
export async function addVideoDetailJob(awemeId: string) {
  const job = await crawlerQueue.add(JobType.VIDEO_DETAIL, { awemeId });
  console.log(`添加视频详情任务: ${job.id}, awemeId: ${awemeId}`);
  return job;
}

/**
 * 添加视频评论任务到队列
 * @param awemeId 视频ID
 * @param cursor 分页游标
 * @returns Job 对象
 */
export async function addVideoCommentsJob(awemeId: string, cursor?: number) {
  const job = await crawlerQueue.add(JobType.VIDEO_COMMENTS, { awemeId, cursor });
  console.log(`添加视频评论任务: ${job.id}, awemeId: ${awemeId}`);
  return job;
}

/**
 * 添加用户信息任务到队列
 * @param secUserId 用户ID
 * @returns Job 对象
 */
export async function addUserInfoJob(secUserId: string) {
  const job = await crawlerQueue.add(JobType.USER_INFO, { secUserId });
  console.log(`添加用户信息任务: ${job.id}, secUserId: ${secUserId}`);
  return job;
}

/**
 * 获取队列统计信息
 * @returns 队列统计
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    crawlerQueue.getWaitingCount(),
    crawlerQueue.getActiveCount(),
    crawlerQueue.getCompletedCount(),
    crawlerQueue.getFailedCount(),
    crawlerQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

/**
 * 清空队列
 */
export async function cleanQueue() {
  await crawlerQueue.drain();
  console.log('队列已清空');
}

/**
 * 关闭队列连接
 */
export async function closeQueue() {
  await crawlerQueue.close();
  await connection.quit();
  console.log('队列连接已关闭');
}