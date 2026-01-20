import { describe, it, expect } from 'vitest';
import { getSignService } from '../src/douyin/sign';

describe('DouyinSignService', () => {
  const signService = getSignService();

  const testParams = 'device_platform=webapp&aid=6383&channel=channel_pc_web&update_version_code=170400&pc_client_type=1&version_code=170400&version_name=17.4.0&cookie_enabled=true&screen_width=1536&screen_height=864&browser_language=zh-CN&browser_platform=Win32&browser_name=Chrome&browser_version=123.0.0.0&browser_online=true&engine_name=Blink&engine_version=123.0.0.0&os_name=Windows&os_version=10&cpu_core_num=16&device_memory=8&platform=PC&downlink=10&effective_type=4g&round_trip_time=50&webid=7362810250930783783&msToken=VkDUvz1y24CppXSl80iFPr6ez-3FiizcwD7fI1OqBt6IICq9RWG7nCvxKb8IVi55mFd-wnqoNkXGnxHrikQb4PuKob5Q-YhDp5Um215JzlBszkUyiEvR';

  const testUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

  it('应该成功生成 detail 类型签名', () => {
    const sign = signService.signDetail(testParams, testUserAgent);
    
    expect(sign).toBeDefined();
    expect(typeof sign).toBe('string');
    expect(sign.length).toBeGreaterThan(0);
    expect(sign.endsWith('=')).toBe(true);
    
    // 签名应该包含 base64 字符（包含 - 字符）
    expect(sign).toMatch(/^[A-Za-z0-9+/=-]+$/);
  });

  it('应该成功生成 reply 类型签名', () => {
    const sign = signService.signReply(testParams, testUserAgent);
    
    expect(sign).toBeDefined();
    expect(typeof sign).toBe('string');
    expect(sign.length).toBeGreaterThan(0);
    expect(sign.endsWith('=')).toBe(true);
    
    // 签名应该包含 base64 字符（包含 - 字符）
    expect(sign).toMatch(/^[A-Za-z0-9+/=-]+$/);
  });

  it('相同参数应该生成不同的签名（因为包含随机数）', () => {
    const sign1 = signService.signDetail(testParams, testUserAgent);
    const sign2 = signService.signDetail(testParams, testUserAgent);
    
    expect(sign1).not.toBe(sign2);
  });

  it('签名应该包含随机性', () => {
    const signs = Array.from({ length: 10 }, () => 
      signService.signDetail(testParams, testUserAgent)
    );
    
    const uniqueSigns = new Set(signs);
    // 10次签名应该至少有 8 个不同的结果（允许少量重复）
    expect(uniqueSigns.size).toBeGreaterThanOrEqual(8);
  });
});