/**
 * RabbitMQ Client 示例
 */

import dotenv from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { DouyinClient } from '@qiudeng/crawler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config();

// 输出目录
const OUTPUT_DIR = join(__dirname, '../../output');

// 确保输出目录存在
mkdirSync(OUTPUT_DIR, { recursive: true });

// 保存结果到文件
function saveResult(name: string, data: unknown) {
  const filename = join(OUTPUT_DIR, `${name}.json`);
  writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ ${name} → ${filename}`);
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 启动 RabbitMQ Client');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = new DouyinClient({
    // 其他配置可选，会从环境变量读取
    // host: 'localhost',
    // port: 5672,
    // user: 'qiudeng',
    // pass: 'qiudeng',
    // exchange: 'douyin',
  });

  try {
    // 示例: 获取视频详情
    console.log('📤 发送请求: getAwemeDetail');
    const awemeDetail = await client.getAwemeDetail('7589820189332622611');
    saveResult('aweme-detail', awemeDetail);

    // 示例: 获取用户作品列表
    console.log('📤 发送请求: getUserAwemeList');
    const userAwemeList = await client.getUserAwemeList('MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE');
    saveResult('user-aweme-list', userAwemeList);

    // 示例: 搜索视频
    console.log('📤 发送请求: searchAweme');
    const searchResult = await client.searchAweme('搞笑');
    saveResult('search-aweme', searchResult);

    console.log('\n✅ 所有请求完成，结果已保存到 ./output 目录');
  } catch (error) {
    console.error('❌ 请求失败:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Client 已关闭');
  }
}

main();
