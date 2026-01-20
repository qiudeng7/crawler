/**
 * BullMQ Job 类型定义
 */

import { Job } from 'bullmq';
import { SearchParams, SearchChannelType, SearchSortType, PublishTimeType } from '../douyin/types';

/**
 * Job 类型枚举
 */
export enum JobType {
  SEARCH = 'search',           // 搜索任务
  VIDEO_DETAIL = 'video_detail',  // 视频详情任务
  VIDEO_COMMENTS = 'video_comments', // 视频评论任务
  USER_INFO = 'user_info',     // 用户信息任务
}

/**
 * 搜索 Job 数据接口
 */
export interface SearchJobData {
  keyword: string;
  offset?: number;
  search_channel?: SearchChannelType;
  sort_type?: SearchSortType;
  publish_time?: PublishTimeType;
  search_id?: string;
  count?: number;
}

/**
 * 视频详情 Job 数据接口
 */
export interface VideoDetailJobData {
  awemeId: string;
}

/**
 * 视频评论 Job 数据接口
 */
export interface VideoCommentsJobData {
  awemeId: string;
  cursor?: number;
}

/**
 * 用户信息 Job 数据接口
 */
export interface UserInfoJobData {
  secUserId: string;
}

/**
 * Job 结果接口
 */
export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  jobId?: string;
}

/**
 * 所有 Job 数据类型的联合类型
 */
export type JobData = 
  | SearchJobData 
  | VideoDetailJobData 
  | VideoCommentsJobData 
  | UserInfoJobData;

/**
 * 自定义 Job 接口
 */
export interface CrawlerJob extends Job {
  data: JobData;
}