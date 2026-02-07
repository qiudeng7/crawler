/**
 * 抖音签名模块 - TypeScript实现
 *
 * 实现抖音API的 a_bogus 签名生成算法
 * 包含：SM3哈希、RC4加密、自定义Base64编码
 */

// ============================================================================
// 类型定义
// ============================================================================

type ByteArray = number[];
type SignArguments = [number, number, number];

interface SignOptions {
  urlSearchParams: string;
  userAgent: string;
  windowEnv?: string;
  suffix?: string;
  arguments?: SignArguments;
}

// ============================================================================
// 自定义Base64编码
// ============================================================================

const BASE64_TABLES: Record<string, string> = {
  s0: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  s1: "Dkdpgh4ZKsQB80/Mfvw36XI1R25+WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=",
  s2: "Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=",
  s3: "ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe",
  s4: "Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe",
};

function resultEncrypt(longStr: string, table: string = "s0"): string {
  const constant = {
    0: 16515072, // 0xFC0000
    1: 258048,   // 0x3F000
    2: 4032,     // 0xFC0
    str: BASE64_TABLES[table] || BASE64_TABLES.s0,
  };

  let result = "";
  let round = 0;

  for (let i = 0; i < (longStr.length / 3) * 4; i++) {
    if (Math.floor(i / 4) !== round) {
      round += 1;
    }

    const longInt = getLongInt(round, longStr);
    const key = i % 4;
    let tempInt: number;

    switch (key) {
      case 0:
        tempInt = (longInt & constant[0]) >> 18;
        break;
      case 1:
        tempInt = (longInt & constant[1]) >> 12;
        break;
      case 2:
        tempInt = (longInt & constant[2]) >> 6;
        break;
      case 3:
        tempInt = longInt & 63;
        break;
      default:
        continue;
    }

    result += constant.str.charAt(tempInt);
  }

  return result;
}

function getLongInt(round: number, longStr: string): number {
  round = round * 3;
  return (
    (longStr.charCodeAt(round) << 16) |
    (longStr.charCodeAt(round + 1) << 8) |
    longStr.charCodeAt(round + 2)
  );
}

// ============================================================================
// RC4 加密
// ============================================================================

function rc4Encrypt(plaintext: string, key: string): string {
  const s: number[] = [];
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }

  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }

  let i = 0;
  j = 0;
  const cipher: number[] = [];

  for (let k = 0; k < plaintext.length; k++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
    const t = (s[i] + s[j]) % 256;
    cipher.push(String.fromCharCode(s[t] ^ plaintext.charCodeAt(k)).charCodeAt(0));
  }

  return cipher.map((c) => String.fromCharCode(c)).join("");
}

// ============================================================================
// SM3 哈希算法 (国密哈希算法)
// ============================================================================

class SM3 {
  private reg: number[] = [];
  private chunk: number[] = [];
  private size: number = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.reg = [
      1937774191, 1226093241, 388252375, 3666478592,
      2842636476, 372324522, 3817729613, 2969243214,
    ];
    this.chunk = [];
    this.size = 0;
  }

  write(data: string | number[]): void {
    const bytes = typeof data === "string" ? this.stringToBytes(data) : data;
    this.size += bytes.length;

    let fill = 64 - this.chunk.length;
    if (bytes.length < fill) {
      this.chunk = this.chunk.concat(bytes);
    } else {
      this.chunk = this.chunk.concat(bytes.slice(0, fill));
      while (this.chunk.length >= 64) {
        this.compress(this.chunk);
        if (fill < bytes.length) {
          this.chunk = bytes.slice(fill, Math.min(fill + 64, bytes.length));
        } else {
          this.chunk = [];
        }
        fill += 64;
      }
    }
  }

  sum(format: "hex" | "bytes" = "bytes", input?: string): string | number[] {
    if (input) {
      this.reset();
      this.write(input);
    }

    this.fill();
    for (let i = 0; i < this.chunk.length; i += 64) {
      this.compress(this.chunk.slice(i, i + 64));
    }

    if (format === "hex") {
      let result = "";
      for (let i = 0; i < 8; i++) {
        result += this.pad8(this.reg[i].toString(16));
      }
      this.reset();
      return result;
    } else {
      const result: number[] = new Array(32);
      for (let i = 0; i < 8; i++) {
        let c = this.reg[i];
        result[4 * i + 3] = c & 255;
        c >>>= 8;
        result[4 * i + 2] = c & 255;
        c >>>= 8;
        result[4 * i + 1] = c & 255;
        c >>>= 8;
        result[4 * i] = c & 255;
      }
      this.reset();
      return result;
    }
  }

  private stringToBytes(str: string): number[] {
    const encoded = encodeURIComponent(str).replace(
      /%([0-9A-F]{2})/g,
      (_, hex) => String.fromCharCode(parseInt("0x" + hex))
    );
    const bytes: number[] = new Array(encoded.length);
    for (let i = 0; i < encoded.length; i++) {
      bytes[i] = encoded.charCodeAt(i);
    }
    return bytes;
  }

  private fill(): void {
    const bits = this.size * 8;
    this.chunk.push(128);
    let fill = this.chunk.length % 64;
    if (64 - fill < 8) {
      fill -= 64;
    }
    while (fill < 56) {
      this.chunk.push(0);
      fill++;
    }

    // 高32位
    for (let i = 0; i < 4; i++) {
      const c = Math.floor(bits / 4294967296);
      this.chunk.push((c >>> (8 * (3 - i))) & 255);
    }
    // 低32位
    for (let i = 0; i < 4; i++) {
      this.chunk.push((bits >>> (8 * (3 - i))) & 255);
    }
  }

  private compress(data: number[]): void {
    if (data.length < 64) {
      throw new Error("compress error: not enough data");
    }

    const w = this.expandMessage(data);
    const reg = this.reg.slice(0);

    for (let j = 0; j < 64; j++) {
      const ss1 = this.leftRotate(
        (this.leftRotate(reg[0], 12) + reg[4] + this.leftRotate(this.tj(j), j)) | 0,
        7
      ) >>> 0;
      const ss2 = ss1 ^ this.leftRotate(reg[0], 12);
      const ff1 = this.ffj(j, reg[0], reg[1], reg[2]);
      const tt1 = (ff1 + reg[3] + ss1 + w[j + 68]) | 0;
      const gg1 = this.ggj(j, reg[4], reg[5], reg[6]);
      const tt2 = (gg1 + reg[7] + ss2 + w[j]) | 0;

      reg[3] = reg[2];
      reg[2] = this.leftRotate(reg[1], 9);
      reg[1] = reg[0];
      reg[0] = tt1;
      reg[7] = reg[6];
      reg[6] = this.leftRotate(reg[5], 19);
      reg[5] = reg[4];
      reg[4] = (tt2 ^ this.leftRotate(tt2, 9) ^ this.leftRotate(tt2, 17)) >>> 0;
    }

    for (let i = 0; i < 8; i++) {
      this.reg[i] = (this.reg[i] ^ reg[i]) >>> 0;
    }
  }

  private expandMessage(data: number[]): number[] {
    const w: number[] = new Array(132);

    // 将数据转换为32位大端序整数
    for (let i = 0; i < 16; i++) {
      w[i] =
        (data[4 * i] << 24) |
        (data[4 * i + 1] << 16) |
        (data[4 * i + 2] << 8) |
        data[4 * i + 3];
      w[i] >>>= 0;
    }

    // 扩展
    for (let i = 16; i < 68; i++) {
      const a = w[i - 16] ^ w[i - 9] ^ this.leftRotate(w[i - 3], 15);
      const b = a ^ this.leftRotate(a, 15) ^ this.leftRotate(a, 23);
      w[i] = (b ^ this.leftRotate(w[i - 13], 7) ^ w[i - 6]) >>> 0;
    }

    for (let i = 0; i < 64; i++) {
      w[i + 68] = (w[i] ^ w[i + 4]) >>> 0;
    }

    return w;
  }

  private leftRotate(value: number, bits: number): number {
    return ((value << (bits % 32)) | (value >>> (32 - (bits % 32)))) >>> 0;
  }

  private tj(j: number): number {
    if (j >= 0 && j < 16) return 2043430169;
    if (j >= 16 && j < 64) return 2055708042;
    throw new Error("invalid j for constant Tj");
  }

  private ffj(j: number, x: number, y: number, z: number): number {
    if (j >= 0 && j < 16) return (x ^ y ^ z) >>> 0;
    if (j >= 16 && j < 64) return (x & y) | (x & z) | (y & z);
    throw new Error("invalid j for bool function FF");
  }

  private ggj(j: number, x: number, y: number, z: number): number {
    if (j >= 0 && j < 16) return (x ^ y ^ z) >>> 0;
    if (j >= 16 && j < 64) return (x & y) | (~x & z);
    throw new Error("invalid j for bool function GG");
  }

  private pad8(str: string): string {
    return "0".repeat(8 - str.length) + str;
  }
}

// ============================================================================
// 随机数生成
// ============================================================================

function generateRandom(): string {
  function generRandom(random: number, option: number[]): number[] {
    return [
      (random & 255 & 170) | (option[0] & 85),
      (random & 255 & 85) | (option[0] & 170),
      ((random >> 8) & 255 & 170) | (option[1] & 85),
      ((random >> 8) & 255 & 85) | (option[1] & 170),
    ];
  }

  const randomList: number[] = [
    ...generRandom(Math.random() * 10000, [3, 45]),
    ...generRandom(Math.random() * 10000, [1, 0]),
    ...generRandom(Math.random() * 10000, [1, 5]),
  ];

  return String.fromCharCode(...randomList);
}

// ============================================================================
// 核心：生成 RC4 BB 字符串
// ============================================================================

function generateRc4BbStr(
  urlSearchParams: string,
  userAgent: string,
  windowEnvStr: string,
  suffix: string = "cus",
  signArgs: SignArguments = [0, 1, 14]
): string {
  const sm3 = new SM3();
  const startTime = Date.now();

  // 1. url_search_params 两次 sm3 哈希
  const urlParamsHash = sm3.sum("bytes", sm3.sum("bytes", urlSearchParams + suffix) as string) as number[];

  // 2. 对后缀两次 sm3 哈希
  const suffixHash = sm3.sum("bytes", sm3.sum("bytes", suffix) as string) as number[];

  // 3. 对 UA 进行 RC4 + SM3 处理
  const uaEncrypted = rc4Encrypt(
    userAgent,
    String.fromCharCode(0.00390625, 1, signArgs[2])
  );
  const uaHash = sm3.sum("bytes", resultEncrypt(uaEncrypted, "s3")) as number[];

  const endTime = Date.now();

  // 构建 b 对象
  const b: Record<number, any> = {
    8: 3,
    10: endTime,
    15: {
      aid: 6383,
      pageId: 6241,
      boe: false,
      ddrt: 7,
      paths: {
        include: [{}, {}, {}, {}, {}, {}, {}],
        exclude: [],
      },
      track: {
        mode: 0,
        delay: 300,
        paths: [],
      },
      dump: true,
      rpU: "",
    },
    16: startTime,
    18: 44,
    19: [1, 0, 1, 5],
  };

  // 时间戳处理
  b[20] = (b[16] >> 24) & 255;
  b[21] = (b[16] >> 16) & 255;
  b[22] = (b[16] >> 8) & 255;
  b[23] = b[16] & 255;
  b[24] = (b[16] / 256 / 256 / 256 / 256) >> 0;
  b[25] = (b[16] / 256 / 256 / 256 / 256 / 256) >> 0;

  // Arguments 处理
  b[26] = (signArgs[0] >> 24) & 255;
  b[27] = (signArgs[0] >> 16) & 255;
  b[28] = (signArgs[0] >> 8) & 255;
  b[29] = signArgs[0] & 255;
  b[30] = (signArgs[1] / 256) & 255;
  b[31] = signArgs[1] % 256;
  b[32] = (signArgs[1] >> 24) & 255;
  b[33] = (signArgs[1] >> 16) & 255;
  b[34] = (signArgs[2] >> 24) & 255;
  b[35] = (signArgs[2] >> 16) & 255;
  b[36] = (signArgs[2] >> 8) & 255;
  b[37] = signArgs[2] & 255;

  // 哈希值处理
  b[38] = urlParamsHash[21];
  b[39] = urlParamsHash[22];
  b[40] = suffixHash[21];
  b[41] = suffixHash[22];
  b[42] = uaHash[23];
  b[43] = uaHash[24];

  b[44] = (b[10] >> 24) & 255;
  b[45] = (b[10] >> 16) & 255;
  b[46] = (b[10] >> 8) & 255;
  b[47] = b[10] & 255;
  b[48] = b[8];
  b[49] = (b[10] / 256 / 256 / 256 / 256) >> 0;
  b[50] = (b[10] / 256 / 256 / 256 / 256 / 256) >> 0;

  // object配置项
  b[51] = b[15].pageId;
  b[52] = (b[15].pageId >> 24) & 255;
  b[53] = (b[15].pageId >> 16) & 255;
  b[54] = (b[15].pageId >> 8) & 255;
  b[55] = b[15].pageId & 255;

  b[56] = b[15].aid;
  b[57] = b[15].aid & 255;
  b[58] = (b[15].aid >> 8) & 255;
  b[59] = (b[15].aid >> 16) & 255;
  b[60] = (b[15].aid >> 24) & 255;

  // 环境字符串处理
  const windowEnvList: number[] = [];
  for (let i = 0; i < windowEnvStr.length; i++) {
    windowEnvList.push(windowEnvStr.charCodeAt(i));
  }

  b[64] = windowEnvList.length;
  b[65] = b[64] & 255;
  b[66] = (b[64] >> 8) & 255;

  b[69] = [].length;
  b[70] = b[69] & 255;
  b[71] = (b[69] >> 8) & 255;

  // XOR 校验
  b[72] =
    b[18] ^
    b[20] ^
    b[26] ^
    b[30] ^
    b[38] ^
    b[40] ^
    b[42] ^
    b[21] ^
    b[27] ^
    b[31] ^
    b[35] ^
    b[39] ^
    b[41] ^
    b[43] ^
    b[22] ^
    b[28] ^
    b[32] ^
    b[36] ^
    b[23] ^
    b[29] ^
    b[33] ^
    b[37] ^
    b[44] ^
    b[45] ^
    b[46] ^
    b[47] ^
    b[48] ^
    b[49] ^
    b[50] ^
    b[24] ^
    b[25] ^
    b[52] ^
    b[53] ^
    b[54] ^
    b[55] ^
    b[57] ^
    b[58] ^
    b[59] ^
    b[60] ^
    b[65] ^
    b[66] ^
    b[70] ^
    b[71];

  // 构建 BB 数组
  const bb: number[] = [
    b[18],
    b[20],
    b[52],
    b[26],
    b[30],
    b[34],
    b[58],
    b[38],
    b[40],
    b[53],
    b[42],
    b[21],
    b[27],
    b[54],
    b[55],
    b[31],
    b[35],
    b[57],
    b[39],
    b[41],
    b[43],
    b[22],
    b[28],
    b[32],
    b[60],
    b[36],
    b[23],
    b[29],
    b[33],
    b[37],
    b[44],
    b[45],
    b[59],
    b[46],
    b[47],
    b[48],
    b[49],
    b[50],
    b[24],
    b[25],
    b[65],
    b[66],
    b[70],
    b[71],
    ...windowEnvList,
    b[72],
  ];

  return rc4Encrypt(String.fromCharCode(...bb), String.fromCharCode(121));
}

// ============================================================================
// 主签名函数
// ============================================================================

/**
 * 生成抖音API签名
 *
 * @param options - 签名选项
 * @returns a_bogus 签名字符串
 */
export function sign(options: SignOptions): string {
  const {
    urlSearchParams,
    userAgent,
    windowEnv = "1536|747|1536|834|0|30|0|0|1536|834|1536|864|1525|747|24|24|Win32",
    suffix = "cus",
    arguments: args = [0, 1, 14],
  } = options;

  const randomPrefix = generateRandom();
  const encryptedBody = generateRc4BbStr(
    urlSearchParams,
    userAgent,
    windowEnv,
    suffix,
    args
  );

  const resultStr = randomPrefix + encryptedBody;
  return resultEncrypt(resultStr, "s4") + "=";
}

/**
 * 生成作品详情接口签名
 *
 * @param params - URL查询参数
 * @param userAgent - User-Agent字符串
 * @returns a_bogus 签名
 */
export function signDetail(params: string, userAgent: string): string {
  return sign({
    urlSearchParams: params,
    userAgent,
    arguments: [0, 1, 14],
  });
}

/**
 * 生成评论接口签名
 *
 * @param params - URL查询参数
 * @param userAgent - User-Agent字符串
 * @returns a_bogus 签名
 */
export function signReply(params: string, userAgent: string): string {
  return sign({
    urlSearchParams: params,
    userAgent,
    arguments: [0, 1, 8],
  });
}

// ============================================================================
// 导出所有工具函数（用于测试）
// ============================================================================

export const utils = {
  rc4Encrypt,
  resultEncrypt,
  SM3,
  generateRandom,
  generateRc4BbStr,
};

// ============================================================================
// 默认导出
// ============================================================================

export default {
  sign,
  signDetail,
  signReply,
  utils,
};
