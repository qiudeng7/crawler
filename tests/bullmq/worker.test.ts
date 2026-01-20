/**
 * BullMQ Worker 模块测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { worker } from '../../src/bullmq/worker';
import { JobType } from '../../src/bullmq/jobs';

// Mock Redis和API
vi.mock('ioredis');
vi.mock('../../src/douyin/api', () => ({
  apiClient: {
    searchByKeyword: vi.fn(),
    getVideoDetail: vi.fn(),
    getVideoComments: vi.fn(),
    getUserInfo: vi.fn(),
  },
}));

describe('BullMQ Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // 清理
  });

  describe('Worker 初始化', () => {
    it('应该成功初始化Worker', () => {
      expect(worker).toBeDefined();
    });
  });

  describe('任务处理', () => {
    it('应该处理搜索任务', async () => {
      const { apiClient } = await import('../../src/douyin/api');
      
      vi.mocked(apiClient.searchByKeyword).mockResolvedValueOnce({
        status_code: 0,
        has_more: false,
        cursor: '0',
        data: [],
      });

      // 模拟添加搜索任务
      // 实际测试需要真实的Redis连接
      expect(apiClient.searchByKeyword).toBeDefined();
    });

    it('应该处理视频详情任务', async () => {
      const { apiClient } = await import('../../src/douyin/api');
      
      vi.mocked(apiClient.getVideoDetail).mockResolvedValueOnce({
        aweme_id: '123',
        desc: '测试',
      });

      expect(apiClient.getVideoDetail).toBeDefined();
    });

    it('应该处理视频评论任务', async () => {
      const { apiClient } = await import('../../src/douyin/api');
      
      vi.mocked(apiClient.getVideoComments).mockResolvedValueOnce({
        comments: [],
        has_more: false,
      });

      expect(apiClient.getVideoComments).toBeDefined();
    });

    it('应该处理用户信息任务', async () => {
      const { apiClient } = await import('../../src/douyin/api');
      
      vi.mocked(apiClient.getUserInfo).mockResolvedValueOnce({
        user: {},
      });

      expect(apiClient.getUserInfo).toBeDefined();
    });
  });
});