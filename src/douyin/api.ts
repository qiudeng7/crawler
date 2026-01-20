/**
 * 抖音搜索API封装
 * 基于 MediaCrawler 的实现，使用纯 HTTP 请求方式
 */

import axios, { AxiosInstance } from 'axios';
import * as querystring from 'querystring';
import { signer } from './signer';
import {
  SearchParams,
  SearchResultData,
  SearchChannelType,
  SearchSortType,
  PublishTimeType,
  CommonParams,
} from './types';

/**
 * 抖音API客户端类
 */
export class DouyinApiClient {
  private client: AxiosInstance;
  private userAgent: string;
  private webId: string;
  private msToken: string;
  private host: string = 'https://www.douyin.com';

  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
    this.webId = signer.generateWebId();
    this.msToken = signer.generateMsToken();

    // 初始化 axios 实例
    this.client = axios.create({
      timeout: 60000,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.douyin.com/',
        'Origin': 'https://www.douyin.com',
      },
    });
  }

  /**
   * 获取通用请求参数
   */
  private getCommonParams(): Partial<CommonParams> {
    return {
      device_platform: 'webapp',
      aid: '6383',
      channel: 'channel_pc_web',
      version_code: '190600',
      version_name: '19.6.0',
      update_version_code: '170400',
      pc_client_type: '1',
      cookie_enabled: 'true',
      browser_language: 'zh-CN',
      browser_platform: 'Win32',
      browser_name: 'Chrome',
      browser_version: '123.0.0.0',
      browser_online: 'true',
      engine_name: 'Blink',
      os_name: 'Windows',
      os_version: '10',
      cpu_core_num: '16',
      device_memory: '8',
      engine_version: '109.0',
      platform: 'PC',
      screen_width: '1536',
      screen_height: '864',
      effective_type: '4g',
      round_trip_time: '50',
      webid: this.webId,
      msToken: this.msToken,
    };
  }

  /**
   * 处理请求参数，添加签名
   */
  private async processParams(
    params: Record<string, any>,
    uri: string
  ): Promise<Record<string, any>> {
    const commonParams = this.getCommonParams();
    const mergedParams = { ...commonParams, ...params };

    // 搜索API不需要签名（根据MediaCrawler代码）
    // 但如果需要，可以在这里添加签名逻辑
    if (!uri.includes('/v1/web/general/search')) {
      const queryString = querystring.stringify(mergedParams);
      const aBogus = signer.generateABogus(queryString, this.userAgent);
      mergedParams.a_bogus = aBogus;
    }

    return mergedParams;
  }

  /**
   * 发送GET请求
   */
  private async get<T = any>(
    uri: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    try {
      const processedParams = await this.processParams(params, uri);
      const response = await this.client.get<T>(`${this.host}${uri}`, {
        params: processedParams,
      });

      if (response.data === '' || response.data === 'blocked') {
        throw new Error('账号被封禁或请求被拦截');
      }

      return response.data;
    } catch (error) {
      console.error('GET请求失败:', error);
      throw error;
    }
  }

  /**
   * 发送POST请求
   */
  private async post<T = any>(
    uri: string,
    data: Record<string, any> = {}
  ): Promise<T> {
    try {
      const processedData = await this.processParams(data, uri);
      const response = await this.client.post<T>(`${this.host}${uri}`, processedData);

      if (response.data === '' || response.data === 'blocked') {
        throw new Error('账号被封禁或请求被拦截');
      }

      return response.data;
    } catch (error) {
      console.error('POST请求失败:', error);
      throw error;
    }
  }

  /**
   * 根据关键词搜索视频
   * @param params 搜索参数
   * @returns 搜索结果
   */
  async searchByKeyword(params: SearchParams): Promise<SearchResultData> {
    const queryParams: any = {
      search_channel: params.search_channel || SearchChannelType.GENERAL,
      enable_history: '1',
      keyword: params.keyword,
      search_source: 'tab_search',
      query_correct_type: '1',
      is_filter_search: '0',
      from_group_id: '7378810571505847586',
      offset: params.offset || 0,
      count: params.count || 15,
      need_filter_settings: '1',
      list_type: 'multi',
      search_id: params.search_id || '',
    };

    // 添加排序和发布时间筛选
    const sortType = params.sort_type || SearchSortType.GENERAL;
    const publishTime = params.publish_time || PublishTimeType.UNLIMITED;

    if (sortType !== SearchSortType.GENERAL || publishTime !== PublishTimeType.UNLIMITED) {
      queryParams.filter_selected = JSON.stringify({
        sort_type: String(sortType),
        publish_time: String(publishTime),
      });
      queryParams.is_filter_search = 1;
      queryParams.search_source = 'tab_search';
    }

    const refererUrl = `https://www.douyin.com/search/${encodeURIComponent(params.keyword)}?aid=f594bbd9-a0e2-4651-9319-ebe3cb6298c1&type=general`;

    try {
      const result = await this.get<SearchResultData>(
        '/aweme/v1/web/general/search/single/',
        queryParams
      );
      return result;
    } catch (error) {
      console.error('搜索失败:', error);
      throw error;
    }
  }

  /**
   * 获取视频详情
   * @param awemeId 视频ID
   * @returns 视频详情数据
   */
  async getVideoDetail(awemeId: string): Promise<any> {
    const params = { aweme_id: awemeId };
    try {
      const result = await this.get('/aweme/v1/web/aweme/detail/', params);
      return result.aweme_detail || {};
    } catch (error) {
      console.error('获取视频详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取视频评论
   * @param awemeId 视频ID
   * @param cursor 分页游标
   * @returns 评论数据
   */
  async getVideoComments(awemeId: string, cursor: number = 0): Promise<any> {
    const params = {
      aweme_id: awemeId,
      cursor: cursor,
      count: 20,
      item_type: 0,
    };
    try {
      const result = await this.get('/aweme/v1/web/comment/list/', params);
      return result;
    } catch (error) {
      console.error('获取评论失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   * @param secUserId 用户ID
   * @returns 用户信息
   */
  async getUserInfo(secUserId: string): Promise<any> {
    const params = {
      sec_user_id: secUserId,
      publish_video_strategy_type: 2,
      personal_center_strategy: 1,
    };
    try {
      const result = await this.get('/aweme/v1/web/user/profile/other/', params);
      return result;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const apiClient = new DouyinApiClient();