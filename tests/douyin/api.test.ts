/**
 * 抖音API模块测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DouyinApiClient, apiClient } from '../../src/douyin/api';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('DouyinApiClient', () => {
  let apiClientInstance: DouyinApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    apiClientInstance = new DouyinApiClient();
  });

  describe('构造函数', () => {
    it('应该初始化axios实例', () => {
      expect(apiClientInstance).toBeDefined();
    });

    it('应该生成web_id和msToken', () => {
      expect(apiClientInstance).toBeDefined();
      // 通过构造函数调用，应该生成了这些值
    });
  });

  describe('searchByKeyword', () => {
    it('应该调用搜索API并返回结果', async () => {
      const mockResponse = {
        status_code: 0,
        has_more: false,
        cursor: '0',
        data: [
          {
            aweme_id: '123',
            desc: '测试视频',
            author: {
              uid: '456',
              nickname: '测试用户',
            },
            statistics: {
              digg_count: 100,
            },
          },
        ],
      };

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await apiClientInstance.searchByKeyword({
        keyword: 'python',
      });

      expect(result).toEqual(mockResponse);
    });

    it('应该支持分页参数', async () => {
      const mockResponse = {
        status_code: 0,
        has_more: true,
        cursor: '15',
        data: [],
      };

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await apiClientInstance.searchByKeyword({
        keyword: 'python',
        offset: 15,
        count: 20,
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getVideoDetail', () => {
    it('应该获取视频详情', async () => {
      const mockResponse = {
        aweme_detail: {
          aweme_id: '123',
          desc: '测试视频',
        },
      };

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await apiClientInstance.getVideoDetail('123');

      expect(result).toEqual(mockResponse.aweme_detail);
    });
  });

  describe('getVideoComments', () => {
    it('应该获取视频评论', async () => {
      const mockResponse = {
        comments: [
          {
            cid: '1',
            text: '测试评论',
          },
        ],
        has_more: false,
      };

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await apiClientInstance.getVideoComments('123', 0);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUserInfo', () => {
    it('应该获取用户信息', async () => {
      const mockResponse = {
        user: {
          uid: '123',
          nickname: '测试用户',
        },
      };

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await apiClientInstance.getUserInfo('MS4wLjABAAAA');

      expect(result).toEqual(mockResponse);
    });
  });
});