/**
 * 抖音爬虫测试 - 需要签名的API
 */

import dotenv from 'dotenv';
import { DouyinApiClient } from '../../src/douyin/crawler.js';

// 加载环境变量
dotenv.config();

const COOKIE = process.env.douyin_cookie;

if (!COOKIE) {
  console.error('错误: .env 文件中未找到 douyin_cookie');
  process.exit(1);
}

const TEST_USER_ID = 'MS4wLjABAAAAoHgHnRg-HaPE727mktH6MOtk0UReNfHQXCE8CTFV4Ad0ykmyDaTwGfme0ioyOVns';

async function testSignedApis() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 测试需要签名的API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = new DouyinApiClient({
    cookie: COOKIE!,
    retry: true,
    maxRetries: 3,
  });

  let passCount = 0;
  let failCount = 0;

  // 测试 1: 获取作品详情 (需要签名)
  try {
    console.log('📝 测试 1: 获取作品详情 (需要签名)');
    console.log('作品 ID: 7589820189332622611');
    const detail = await client.getAwemeDetail('7589820189332622611');
    console.log('✅ 状态码:', detail.status_code);
    if (detail.aweme_detail) {
      console.log('✅ 作品描述:', detail.aweme_detail.desc?.substring(0, 50));
      console.log('✅ 作者:', detail.aweme_detail.author?.nickname);
      console.log('✅ 点赞数:', detail.aweme_detail.statistics?.digg_count);
    }
    console.log('');
    passCount++;
  } catch (error) {
    console.error('❌ 测试 1 失败:', (error as Error).message);
    console.log('');
    failCount++;
  }

  // 测试 2: 获取用户粉丝列表 (需要签名)
  try {
    console.log('📝 测试 2: 获取用户粉丝列表 (需要签名)');
    console.log('用户 ID:', TEST_USER_ID);
    const followers = await client.getUserFollowers(TEST_USER_ID, 0, 5);
    console.log('✅ 状态码:', followers.status_code);
    console.log('');
    passCount++;
  } catch (error) {
    console.error('❌ 测试 2 失败:', (error as Error).message);
    console.log('');
    failCount++;
  }
}

testSignedApis();
