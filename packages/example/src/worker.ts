/**
 * RabbitMQ Worker 启动示例
 */

import dotenv from 'dotenv';
import { RabbitMQWorker } from '@qiudeng/crawler';

// 加载环境变量
dotenv.config();

const COOKIE = process.env.DOUYIN_COOKIE;

if (!COOKIE) {
  console.error('错误: .env 文件中未找到 DOUYIN_COOKIE');
  process.exit(1);
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 启动 RabbitMQ Worker');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const worker = new RabbitMQWorker({
    douyinCookie: COOKIE!,
    // 其他配置可选，会从环境变量读取
    // host: 'localhost',
    // port: 5672,
    // user: 'qiudeng',
    // pass: 'qiudeng',
    // exchange: 'douyin',
    // queue: 'douyin_task',
    // routingKey: 'douyin_task',
  });

  // 优雅退出处理
  process.on('SIGINT', async () => {
    console.log('\n\n⏸️  接收到退出信号，正在关闭 worker...');
    await worker.stop();
    console.log('✅ Worker 已关闭');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n⏸️  接收到终止信号，正在关闭 worker...');
    await worker.stop();
    console.log('✅ Worker 已关闭');
    process.exit(0);
  });

  try {
    await worker.start();
    console.log('\n✅ Worker 运行中，按 Ctrl+C 退出\n');
  } catch (error) {
    console.error('❌ Worker 启动失败:', error);
    process.exit(1);
  }
}

main();
