/**
 * 抖音爬虫 - 类型定义
 */

// ============================================================================
// 作品类型
// ============================================================================

export enum AwemeType {
  VIDEO = 4,      // 视频
  IMAGE = 68,     // 图文
  LIVE = 101,     // 直播
}

// ============================================================================
// API 端点
// ============================================================================

export const API_ENDPOINTS = {
  /** 作品详情 */
  AWEME_DETAIL: '/aweme/v1/web/aweme/detail/',
  /** 用户作品列表 */
  AWEME_POST: '/aweme/v1/web/aweme/post/',
  /** 用户喜欢列表 */
  AWEME_FAVORITE: '/aweme/v1/web/aweme/favorite/',
  /** 用户收藏列表 */
  AWEME_COLLECTION: '/aweme/v1/web/aweme/listcollection/',
  /** 音乐作品列表 */
  MUSIC_AWEME: '/aweme/v1/web/music/aweme/',
  /** 话题作品列表 */
  CHALLENGE_AWEME: '/aweme/v1/web/challenge/aweme/',
  /** 合集作品列表 */
  MIX_AWEME: '/aweme/v1/web/mix/aweme/',
  /** 搜索 */
  SEARCH_ITEM: '/aweme/v1/web/search/item/',
  /** 用户关注列表 */
  USER_FOLLOWING: '/aweme/v1/web/user/following/list/',
  /** 用户粉丝列表 */
  USER_FOLLOWER: '/aweme/v1/web/user/follower/list/',
} as const;

/** 需要签名的 API 端点 */
export const SIGNED_APIS = new Set([
  API_ENDPOINTS.AWEME_DETAIL,
  API_ENDPOINTS.MUSIC_AWEME,
  API_ENDPOINTS.USER_FOLLOWER,
] as string[]);

// ============================================================================
// URL 常量
// ============================================================================

export const DOUYIN_URLS = {
  BASE: 'https://www.douyin.com',
  USER: 'https://www.douyin.com/user',
  AWEME: 'https://www.douyin.com/note',
  MIX: 'https://www.douyin.com/collection',
  SEARCH: 'https://www.douyin.com/search',
} as const;

// ============================================================================
// 请求参数类型
// ============================================================================

export interface BaseParams {
  device_platform: string;
  aid: string;
  channel: string;
}

export interface AwemeParams extends BaseParams {
  sec_user_id?: string;
  max_cursor?: number;
  count?: number;
  aweme_id?: string;
  [key: string]: string | number | undefined;
}

export interface SearchParams extends BaseParams {
  keyword: string;
  offset?: number;
  count?: number;
  search_type?: number;
  [key: string]: string | number | undefined;
}

// ============================================================================
// 响应数据类型
// ============================================================================

export interface AwemeAuthor {
  uid: string;
  sec_uid: string;
  unique_id: string;
  short_id: string;
  nickname: string;
  avatar_thumb: url_list;
}

export interface url_list {
  url_list: string[];
}

export interface AwemeVideo {
  play_addr: url_list;
  download_addr: url_list;
  cover: url_list;
  dynamic_cover: url_list;
  duration: number;
}

export interface AwemeMusic {
  id: string;
  title: string;
  author: string;
  cover: url_list;
  play_url: url_list;
}

export interface AwemeStats {
  digg_count: number;
  comment_count: number;
  share_count: number;
  play_count: number;
  collect_count: number;
}

export interface AwemeItem {
  aweme_id: string;
  aweme_type: number;
  desc: string;
  create_time: number;
  author: AwemeAuthor;
  video: AwemeVideo;
  music: AwemeMusic;
  statistics: AwemeStats;
  images?: url_list[];
}

export interface AwemeListResponse {
  status_code: number;
  status_msg: string;
  aweme_list?: AwemeItem[];
  has_more?: boolean;
  max_cursor?: number;
  logid?: string;
}

export interface AwemeDetailResponse {
  status_code: number;
  status_msg: string;
  aweme_detail?: AwemeItem;
}

// ============================================================================
// 爬虫配置类型
// ============================================================================

export type TaskType =
  | 'aweme'      // 单个作品
  | 'post'       // 用户作品
  | 'favorite'   // 用户喜欢
  | 'collection' // 用户收藏
  | 'music'      // 音乐作品
  | 'hashtag'    // 话题作品
  | 'mix'        // 合集作品
  | 'search'     // 搜索
  | 'following'  // 关注列表
  | 'follower';  // 粉丝列表

export interface CrawlerConfig {
  /** Cookie 字符串 */
  cookie: string;
  /** User-Agent */
  userAgent?: string;
  /** msToken (可选，会自动生成) */
  msToken?: string;
  /** webid (可选，会自动生成) */
  webid?: string;
  /** 下载路径 */
  downloadPath?: string;
  /** 采集数量限制 */
  limit?: number;
  /** 是否启用自动重试 */
  retry?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
}

export interface CrawlerResult {
  aweme_id: string;
  id: string;
  type: number;
  desc: string;
  time: number;
  author_nickname: string;
  author_avatar: string;
  author_uid: string;
  author_sec_uid: string;
  author_unique_id: string;
  author_short_id: string;
  cover: string;
  duration: number;
  music_title: string;
  music_url: string;
  music_author: string;
  digg_count: number;
  comment_count: number;
  share_count: number;
  play_count: number;
  download_addr: string | string[];
}
