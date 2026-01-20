/**
 * 服务启动入口
 * 启动 BullMQ Worker 并提供简单的 API 接口
 */

import { closeWorker } from './bullmq/worker';
import { closeQueue, getQueueStats } from './bullmq/queue';
import { addSearchJob } from './bullmq/queue';
import { SearchChannelType, SearchSortType, PublishTimeType } from './douyin/types';

/**
 * 启动服务
 */
async function startServer() {
  console.log('========================================');
  console.log('  抖音爬虫服务启动中...');
  console.log('========================================');
  console.log('');

  // 等待 Worker 启动
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('✓ Worker 已启动');
  console.log('✓ 队列已就绪');
  console.log('');

  // 显示队列统计
  const stats = await getQueueStats();
  console.log('当前队列状态:');
  console.log(`  - 等待中: ${stats.waiting}`);
  console.log(`  - 处理中: ${stats.active}`);
  console.log(`  - 已完成: ${stats.completed}`);
  console.log(`  - 失败: ${stats.failed}`);
  console.log(`  - 延迟: ${stats.delayed}`);
  console.log('');

  console.log('========================================');
  console.log('  服务运行中，按 Ctrl+C 停止');
  console.log('========================================');
  console.log('');

  // 添加一个示例任务（可选）
  if (process.argv.includes('--demo')) {
    console.log('添加演示搜索任务...');
    await addSearchJob({
      keyword: 'python',
      search_channel: SearchChannelType.GENERAL,
      sort_type: SearchSortType.GENERAL,
      publish_time: PublishTimeType.UNLIMITED,
      count: 10,
    });
    console.log('');
  }

  // 优雅退出处理
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

/**
 * 优雅关闭服务
 */
async function gracefulShutdown() {
  console.log('');
  console.log('========================================');
  console.log('  正在关闭服务...');
  console.log('========================================');

  try {
    await closeWorker();
    await closeQueue();
    console.log('✓ 服务已关闭');
    process.exit(0);
  } catch (error) {
    console.error('✓ 关闭服务时出错:', error);
    process.exit(1);
  }
}

// 启动服务
startServer().catch(error => {
  console.error('启动服务失败:', error);
  process.exit(1);
});