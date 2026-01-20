/**
 * 抖音爬虫 - API 层
 *
 * 封装抖音 API 的业务逻辑，使用 request 层发送请求
 */

import { HttpRequestClient } from './request.js';
import type {
  AwemeListResponse,
  AwemeDetailResponse,
  TaskType,
  CrawlerConfig,
} from './types.js';

// ============================================================================
// API 端点映射
// ============================================================================

const ENDPOINT_MAP: Record<TaskType, string> = {
  aweme: '/aweme/v1/web/aweme/detail/',
  post: '/aweme/v1/web/aweme/post/',
  favorite: '/aweme/v1/web/aweme/favorite/',
  collection: '/aweme/v1/web/aweme/listcollection/',
  music: '/aweme/v1/web/music/aweme/',
  hashtag: '/aweme/v1/web/challenge/aweme/',
  mix: '/aweme/v1/web/mix/aweme/',
  search: '/aweme/v1/web/search/item/',
  following: '/aweme/v1/web/user/following/list/',
  follower: '/aweme/v1/web/user/follower/list/',
};

// ============================================================================
// DouyinApiClient 类
// ============================================================================

/**
 * 抖音 API 客户端
 *
 * 提供调用抖音 API 的方法，由 request 层自动处理签名
 */
export class DouyinApiClient {
  private readonly httpClient: HttpRequestClient;

  constructor(config: CrawlerConfig) {
    this.httpClient = new HttpRequestClient(config);
  }

  // ========================================================================
  // 作品相关 API
  // ========================================================================

  /**
   * 获取单个作品详情（需要签名）
   * @param awemeId 作品 ID
   */
  async getAwemeDetail(awemeId: string): Promise<AwemeDetailResponse> {
    return this.httpClient.get<AwemeDetailResponse>(ENDPOINT_MAP.aweme, {
      aweme_id: awemeId,
    });
  }

  /**
   * 获取用户作品列表
   * @param secUserId 用户 sec_user_id
   * @param maxCursor 分页游标
   * @param count 每页数量
   */
  async getUserAwemeList(
    secUserId: string,
    maxCursor: number = 0,
    count: number = 18
  ): Promise<AwemeListResponse> {
    return this.httpClient.get<AwemeListResponse>(ENDPOINT_MAP.post, {
      sec_user_id: secUserId,
      max_cursor: maxCursor,
      count,
    });
  }

  /**
   * 获取用户喜欢列表
   * @param secUserId 用户 sec_user_id
   * @param maxCursor 分页游标
   * @param count 每页数量
   */
  async getUserFavoriteList(
    secUserId: string,
    maxCursor: number = 0,
    count: number = 18
  ): Promise<AwemeListResponse> {
    return this.httpClient.get<AwemeListResponse>(ENDPOINT_MAP.favorite, {
      sec_user_id: secUserId,
      max_cursor: maxCursor,
      count,
    });
  }

  /**
   * 获取用户收藏列表
   * @param secUserId 用户 sec_user_id
   * @param maxCursor 分页游标
   * @param count 每页数量
   */
  async getUserCollectionList(
    secUserId: string,
    maxCursor: number = 0,
    count: number = 18
  ): Promise<AwemeListResponse> {
    return this.httpClient.get<AwemeListResponse>(ENDPOINT_MAP.collection, {
      sec_user_id: secUserId,
      max_cursor: maxCursor,
      count,
    });
  }

  // ========================================================================
  // 音乐/话题/合集相关 API
  // ========================================================================

  /**
   * 获取音乐作品列表（需要签名）
   * @param musicId 音乐 ID
   * @param maxCursor 分页游标
   * @param count 每页数量
   */
  async getMusicAwemeList(
    musicId: string,
    maxCursor: number = 0,
    count: number = 18
  ): Promise<AwemeListResponse> {
    return this.httpClient.get<AwemeListResponse>(ENDPOINT_MAP.music, {
      music_id: musicId,
      max_cursor: maxCursor,
      count,
    });
  }

  /**
   * 获取话题作品列表
   * @param challengeId 话题 ID
   * @param maxCursor 分页游标
   * @param count 每页数量
   */
  async getChallengeAwemeList(
    challengeId: string,
    maxCursor: number = 0,
    count: number = 18
  ): Promise<AwemeListResponse> {
    return this.httpClient.get<AwemeListResponse>(ENDPOINT_MAP.hashtag, {
      challenge_id: challengeId,
      max_cursor: maxCursor,
      count,
    });
  }

  /**
   * 获取合集作品列表
   * @param mixId 合集 ID
   * @param maxCursor 分页游标
   * @param count 每页数量
   */
  async getMixAwemeList(
    mixId: string,
    maxCursor: number = 0,
    count: number = 18
  ): Promise<AwemeListResponse> {
    return this.httpClient.get<AwemeListResponse>(ENDPOINT_MAP.mix, {
      mix_id: mixId,
      max_cursor: maxCursor,
      count,
    });
  }

  // ========================================================================
  // 搜索相关 API
  // ========================================================================

  /**
   * 搜索作品
   * @param keyword 搜索关键词
   * @param offset 偏移量
   * @param count 每页数量
   * @param searchType 搜索类型
   */
  async searchAweme(
    keyword: string,
    offset: number = 0,
    count: number = 10,
    searchType: number = 0
  ): Promise<AwemeListResponse> {
    return this.httpClient.get<AwemeListResponse>(ENDPOINT_MAP.search, {
      keyword,
      offset,
      count,
      search_type: searchType,
    });
  }

  // ========================================================================
  // 用户关系相关 API
  // ========================================================================

  /**
   * 获取用户关注列表
   * @param secUserId 用户 sec_user_id
   * @param maxCursor 分页游标
   * @param count 每页数量
   */
  async getUserFollowing(
    secUserId: string,
    maxCursor: number = 0,
    count: number = 20
  ): Promise<any> {
    return this.httpClient.get<any>(ENDPOINT_MAP.following, {
      sec_user_id: secUserId,
      max_cursor: maxCursor,
      count,
    });
  }

  /**
   * 获取用户粉丝列表（需要签名）
   * @param secUserId 用户 sec_user_id
   * @param maxCursor 分页游标
   * @param count 每页数量
   */
  async getUserFollowers(
    secUserId: string,
    maxCursor: number = 0,
    count: number = 20
  ): Promise<any> {
    return this.httpClient.get<any>(ENDPOINT_MAP.follower, {
      sec_user_id: secUserId,
      max_cursor: maxCursor,
      count,
    });
  }

  // ========================================================================
  // 通用分页获取
  // ========================================================================

  /**
   * 分页获取所有数据
   * @param fetchFn 获取数据的函数
   * @param limit 限制数量，0 表示不限制
   */
  async fetchAll<T>(
    fetchFn: (cursor: number) => Promise<{
      data?: T[];
      has_more?: boolean;
      max_cursor?: number;
    }>,
    limit: number = 0
  ): Promise<T[]> {
    const results: T[] = [];
    let cursor = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchFn(cursor);

      if (response.data) {
        results.push(...response.data);
      }

      // 检查是否达到限制
      if (limit > 0 && results.length >= limit) {
        return results.slice(0, limit);
      }

      hasMore = response.has_more ?? false;
      cursor = response.max_cursor ?? 0;
    }

    return results;
  }

  // ========================================================================
  // 便捷方法
  // ========================================================================

  /**
   * 获取用户所有作品
   * @param secUserId 用户 sec_user_id
   * @param limit 限制数量
   */
  async getAllUserAwemes(secUserId: string, limit: number = 0): Promise<any[]> {
    return this.fetchAll(
      (cursor) => this.getUserAwemeList(secUserId, cursor, 18),
      limit
    );
  }

  /**
   * 获取音乐所有作品（需要签名）
   * @param musicId 音乐 ID
   * @param limit 限制数量
   */
  async getAllMusicAwemes(musicId: string, limit: number = 0): Promise<any[]> {
    return this.fetchAll(
      (cursor) => this.getMusicAwemeList(musicId, cursor, 18),
      limit
    );
  }

  /**
   * 获取用户所有粉丝（需要签名）
   * @param secUserId 用户 sec_user_id
   * @param limit 限制数量
   */
  async getAllUserFollowers(secUserId: string, limit: number = 0): Promise<any[]> {
    return this.fetchAll(
      (cursor) => this.getUserFollowers(secUserId, cursor, 20),
      limit
    );
  }
}

// ============================================================================
// 导出
// ============================================================================

export default DouyinApiClient;
