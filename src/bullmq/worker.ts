/**
 * BullMQ Worker 模块
 * 用于处理爬虫任务
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { JobType, JobData, JobResult } from './jobs';
import { apiClient } from '../douyin/api';

/**
 * 创建 Worker 连接
 */
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

/**
 * 处理搜索任务
 */
async function processSearchJob(job: Job<JobData>): Promise<JobResult> {
  const data = job.data as any;
  console.log(`开始处理搜索任务: ${job.id}, 关键词: ${data.keyword}`);

  try {
    const result = await apiClient.searchByKeyword(data);
    
    console.log(`搜索任务完成: ${job.id}, 结果数量: ${result.data?.length || 0}`);
    
    return {
      success: true,
      data: result,
      jobId: job.id,
    };
  } catch (error) {
    console.error(`搜索任务失败: ${job.id}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      jobId: job.id,
    };
  }
}

/**
 * 处理视频详情任务
 */
async function processVideoDetailJob(job: Job<JobData>): Promise<JobResult> {
  const data = job.data as any;
  console.log(`开始处理视频详情任务: ${job.id}, awemeId: ${data.awemeId}`);

  try {
    const result = await apiClient.getVideoDetail(data.awemeId);
    
    console.log(`视频详情任务完成: ${job.id}`);
    
    return {
      success: true,
      data: result,
      jobId: job.id,
    };
  } catch (error) {
    console.error(`视频详情任务失败: ${job.id}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      jobId: job.id,
    };
  }
}

/**
 * 处理视频评论任务
 */
async function processVideoCommentsJob(job: Job<JobData>): Promise<JobResult> {
  const data = job.data as any;
  console.log(`开始处理视频评论任务: ${job.id}, awemeId: ${data.awemeId}`);

  try {
    const result = await apiClient.getVideoComments(data.awemeId, data.cursor);
    
    console.log(`视频评论任务完成: ${job.id}`);
    
    return {
      success: true,
      data: result,
      jobId: job.id,
    };
  } catch (error) {
    console.error(`视频评论任务失败: ${job.id}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      jobId: job.id,
    };
  }
}

/**
 * 处理用户信息任务
 */
async function processUserInfoJob(job: Job<JobData>): Promise<JobResult> {
  const data = job.data as any;
  console.log(`开始处理用户信息任务: ${job.id}, secUserId: ${data.secUserId}`);

  try {
    const result = await apiClient.getUserInfo(data.secUserId);
    
    console.log(`用户信息任务完成: ${job.id}`);
    
    return {
      success: true,
      data: result,
      jobId: job.id,
    };
  } catch (error) {
    console.error(`用户信息任务失败: ${job.id}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      jobId: job.id,
    };
  }
}

/**
 * 创建 Worker
 */
export const worker = new Worker<JobData, JobResult>(
  'crawler',
  async (job: Job<JobData>) => {
    switch (job.name) {
      case JobType.SEARCH:
        return await processSearchJob(job);
      
      case JobType.VIDEO_DETAIL:
        return await processVideoDetailJob(job);
      
      case JobType.VIDEO_COMMENTS:
        return await processVideoCommentsJob(job);
      
      case JobType.USER_INFO:
        return await processUserInfoJob(job);
      
      default:
        console.warn(`未知的任务类型: ${job.name}`);
        return {
          success: false,
          error: `未知的任务类型: ${job.name}`,
          jobId: job.id,
        };
    }
  },
  {
    connection,
    concurrency: 3,  // 并发处理3个任务
  }
);

/**
 * Worker 事件监听
 */
worker.on('completed', (job: Job<JobData, JobResult>) => {
  console.log(`任务完成: ${job.id}, 类型: ${job.name}`);
});

worker.on('failed', (job: Job<JobData> | undefined, error: Error) => {
  const jobId = job?.id || 'unknown';
  const jobName = job?.name || 'unknown';
  console.error(`任务失败: ${jobId}, 类型: ${jobName}, 错误:`, error);
});

worker.on('error', (error: Error) => {
  console.error('Worker 错误:', error);
});

/**
 * 关闭 Worker
 */
export async function closeWorker() {
  await worker.close();
  await connection.quit();
  console.log('Worker 已关闭');
}