/**
 * BullMQ 队列模块测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { crawlerQueue, addSearchJob, getQueueStats } from '../../src/bullmq/queue';
import { JobType } from '../../src/bullmq/jobs';
import { SearchChannelType, SearchSortType, PublishTimeType } from '../../src/douyin/types';

// Mock Redis
vi.mock('ioredis');

describe('BullMQ 队列', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // 清理队列
    await crawlerQueue.drain();
  });

  describe('addSearchJob', () => {
    it('应该成功添加搜索任务到队列', async () => {
      const job = await addSearchJob({
        keyword: 'test',
        search_channel: SearchChannelType.GENERAL,
        sort_type: SearchSortType.GENERAL,
        publish_time: PublishTimeType.UNLIMITED,
      });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.name).toBe(JobType.SEARCH);
    });

    it('应该生成唯一的jobId', async () => {
      const job1 = await addSearchJob({ keyword: 'test1' });
      const job2 = await addSearchJob({ keyword: 'test2' });

      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('getQueueStats', () => {
    it('应该返回队列统计信息', async () => {
      // 添加一些任务
      await addSearchJob({ keyword: 'test1' });
      await addSearchJob({ keyword: 'test2' });

      const stats = await getQueueStats();

      expect(stats).toBeDefined();
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.delayed).toBe('number');
    });
  });
});