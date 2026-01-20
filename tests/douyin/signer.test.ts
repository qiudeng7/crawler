/**
 * 抖音签名模块测试
 */

import { describe, it, expect } from 'vitest';
import { DouyinSigner, signer } from '../../src/douyin/signer';

describe('DouyinSigner', () => {
  let douyinSigner: DouyinSigner;

  beforeEach(() => {
    douyinSigner = new DouyinSigner();
  });

  describe('generateWebId', () => {
    it('应该生成19位数字的web_id', () => {
      const webId = douyinSigner.generateWebId();
      expect(webId).toBeDefined();
      expect(webId.length).toBe(19);
      expect(/^\d+$/.test(webId)).toBe(true);
    });

    it('每次生成的web_id应该不同', () => {
      const webId1 = douyinSigner.generateWebId();
      const webId2 = douyinSigner.generateWebId();
      expect(webId1).not.toBe(webId2);
    });
  });

  describe('generateMsToken', () => {
    it('应该生成64位的十六进制字符串', () => {
      const msToken = douyinSigner.generateMsToken();
      expect(msToken).toBeDefined();
      expect(msToken.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(msToken)).toBe(true);
    });

    it('每次生成的msToken应该不同', () => {
      const msToken1 = douyinSigner.generateMsToken();
      const msToken2 = douyinSigner.generateMsToken();
      expect(msToken1).not.toBe(msToken2);
    });
  });

  describe('generateABogus', () => {
    it('应该为URL参数生成签名', () => {
      const params = 'keyword=test&offset=0';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      const signature = douyinSigner.generateABogus(params, userAgent);
      
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(10);
    });

    it('相同参数生成的签名应该不同（因为包含随机数）', () => {
      const params = 'keyword=test&offset=0';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      const signature1 = douyinSigner.generateABogus(params, userAgent);
      const signature2 = douyinSigner.generateABogus(params, userAgent);
      
      // 由于包含随机数，签名应该不同
      expect(signature1).not.toBe(signature2);
    });
  });

  describe('generateReplyABogus', () => {
    it('应该为评论参数生成签名', () => {
      const params = 'aweme_id=123&cursor=0';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      const signature = douyinSigner.generateReplyABogus(params, userAgent);
      
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(10);
    });
  });
});

describe('signer 单例', () => {
  it('应该导出单例实例', () => {
    expect(signer).toBeInstanceOf(DouyinSigner);
  });
});