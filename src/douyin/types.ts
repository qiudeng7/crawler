/**
 * 抖音相关类型定义
 */

/**
 * 搜索渠道类型
 */
export enum SearchChannelType {
  GENERAL = 'aweme_general_web', // 通用视频
  VIDEO = 'aweme_video_web',     // 视频搜索
  USER = 'aweme_user_web',       // 用户搜索
  LIVE = 'aweme_live_web',       // 直播搜索
  MUSIC = 'aweme_music_web',     // 音乐搜索
}

/**
 * 搜索排序类型
 */
export enum SearchSortType {
  GENERAL = 0,  // 综合排序
  LATEST = 1,   // 最新发布
  HOT = 2,      // 最热
}

/**
 * 发布时间筛选类型
 */
export enum PublishTimeType {
  UNLIMITED = 0,  // 不限
  ONE_DAY = 1,    // 一天内
  ONE_WEEK = 2,    // 一周内
  ONE_MONTH = 3,   // 一月内
  HALF_YEAR = 4,   // 半年内
}

/**
 * 搜索参数接口
 */
export interface SearchParams {
  keyword: string;
  offset?: number;
  search_channel?: SearchChannelType;
  sort_type?: SearchSortType;
  publish_time?: PublishTimeType;
  search_id?: string;
  count?: number;
}

/**
 * 视频作者信息
 */
export interface AuthorInfo {
  uid: string;
  sec_uid: string;
  unique_id: string;
  nickname: string;
  avatar_thumb: {
    url_list: string[];
  };
  signature: string;
}

/**
 * 视频统计信息
 */
export interface VideoStats {
  digg_count: number;
  comment_count: number;
  share_count: number;
  play_count: number;
}

/**
 * 视频信息
 */
export interface VideoInfo {
  aweme_id: string;
  desc: string;
  create_time: number;
  author: AuthorInfo;
  statistics: VideoStats;
  video: {
    play_addr: {
        url_list: string[];
    };
    cover: {
        url_list: string[];
    };
  };
  is_ads?: boolean;
}

/**
 * 搜索结果数据结构
 */
export interface SearchResultData {
  status_code: number;
  has_more: boolean;
  cursor: string;
  data?: VideoInfo[];
  error_code?: number;
  error_msg?: string;
}

/**
 * 通用请求参数
 */
export interface CommonParams {
  device_platform: string;
  aid: string;
  channel: string;
  version_code: string;
  version_name: string;
  update_version_code: string;
  pc_client_type: string;
  cookie_enabled: string;
  browser_language: string;
  browser_platform: string;
  browser_name: string;
  browser_version: string;
  browser_online: string;
  engine_name: string;
  os_name: string;
  os_version: string;
  cpu_core_num: string;
  device_memory: string;
  engine_version: string;
  platform: string;
  screen_width: string;
  screen_height: string;
  effective_type: string;
  round_trip_time: string;
  webid: string;
  msToken: string;
  a_bogus: string;
}