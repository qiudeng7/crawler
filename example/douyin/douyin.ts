/**
 * 抖音爬虫测试
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

// 测试用的用户 sec_user_id
const TEST_USER_ID = 'MS4wLjABAAAAoHgHnRg-HaPE727mktH6MOtk0UReNfHQXCE8CTFV4Ad0ykmyDaTwGfme0ioyOVns';

async function testDouyinCrawler() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 抖音爬虫测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = new DouyinApiClient({
    cookie: COOKIE!,
    retry: true,
    maxRetries: 3,
  });

  let passCount = 0;
  let failCount = 0;

  // 测试 1: 获取用户作品列表 (不需要签名)
  try {
    console.log('📝 测试 1: 获取用户作品列表 (无签名)');
    console.log('用户 ID:', TEST_USER_ID);
    const awemes = await client.getUserAwemeList(TEST_USER_ID, 0, 5);
    console.log('✅ 状态码:', awemes.status_code);
    console.log('✅ 作品数量:', awemes.aweme_list?.length || 0);
    console.log('✅ 是否有更多:', awemes.has_more);
    if (awemes.aweme_list && awemes.aweme_list.length > 0) {
      const first = awemes.aweme_list[0];
      console.log('✅ 第一个作品描述:', first.desc?.substring(0, 50));
      console.log('✅ 作者:', first.author?.nickname);
    }
    console.log('');
    passCount++;
  } catch (error) {
    console.error('❌ 测试 1 失败:', error);
    console.log('');
    failCount++;
  }

  // 测试 2: 获取用户喜欢列表 (不需要签名)
  try {
    console.log('📝 测试 2: 获取用户喜欢列表 (无签名)');
    const favorites = await client.getUserFavoriteList(TEST_USER_ID, 0, 5);
    console.log('✅ 状态码:', favorites.status_code);
    console.log('✅ 喜欢数量:', favorites.aweme_list?.length || 0);
    console.log('');
    passCount++;
  } catch (error) {
    console.error('❌ 测试 2 失败:', (error as Error).message);
    console.log('');
    failCount++;
  }

  // 测试 3: 搜索作品 (不需要签名)
  try {
    console.log('📝 测试 3: 搜索作品 (无签名)');
    const searchResults = await client.searchAweme('风景', 0, 5);
    console.log('✅ 状态码:', searchResults.status_code);
    console.log('✅ 搜索结果数量:', searchResults.aweme_list?.length || 0);
    console.log('');
    passCount++;
  } catch (error) {
    console.error('❌ 测试 3 失败:', (error as Error).message);
    console.log('');
    failCount++;
  }

  // 测试 4: 获取用户关注列表 (不需要签名)
  try {
    console.log('📝 测试 4: 获取用户关注列表 (无签名)');
    const following = await client.getUserFollowing(TEST_USER_ID, 0, 5);
    console.log('✅ 状态码:', following.status_code);
    console.log('');
    passCount++;
  } catch (error) {
    console.error('❌ 测试 4 失败:', (error as Error).message);
    console.log('');
    failCount++;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 测试结果: ${passCount} 通过, ${failCount} 失败`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (failCount > 0) {
    process.exit(1);
  }
}

// 运行测试
testDouyinCrawler();
