# 社交爬虫服务

基于 Crawlee 和 BullMQ 构建的多平台社交爬虫服务，支持抖音等主流平台的数据采集，采用微服务架构，部署于 Kubernetes 环境。

其他文档

1. [需求描述](./docs/需求描述.md)。
2. [第一阶段计划](./docs/第一阶段.md)
3. [开发者文档](./docs/开发者文档.md)

## 快速开始

本项目的爬虫有两种用法，一个是cli，一个是rabbitmq worker服务，前者主要用于开发测试，后者主要用于k8s部署。

## 如何使用CLI进行开发测试

先准备devcontainer的环境变量 `cp .devcontainer/.env.example .devcontainer/.env`，然后打开devcontainer，会自动启动rabbitmq.

安装依赖`pnpm install`

查看命令行所有可用方法：`pnpm douyin`

单个方法调用(具体参数含义见[cli.ts](./example/douyin/cli.ts)):

```bash
# 获取作品详情
npm run douyin getAwemeDetail 7589820189332622611

# 获取用户作品列表
npm run douyin getUserAwemeList MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE 0 5

# 搜索视频
npm run douyin searchAweme "风景" 0 5

# 获取用户关注列表
npm run douyin getUserFollowing MS4wLjABAAAANuGI7ssePACMvRn7Afd0daB9Su1k4oDr-kHUoUkNLSE 0 5
```

执行所有测试用例（测试用例的定义在example/douyin/cli.ts中，默认并没有全部开启，每个测试随机5~10s间隔）:

```bash
npm run douyin _all
```

### 可用方法列表

| 方法 | 参数 | 说明 | 是否需要签名 |
|------|------|------|-------------|
| `getAwemeDetail` | awemeId | 获取作品详情 | ✅ |
| `getUserAwemeList` | secUserId, maxCursor?, count? | 获取用户作品列表 | ❌ |
| `getUserFavoriteList` | secUserId, maxCursor?, count? | 获取用户喜欢列表 | ❌ |
| `getUserCollectionList` | secUserId, maxCursor?, count? | 获取用户收藏列表 | ❌ |
| `getMusicAwemeList` | musicId, maxCursor?, count? | 获取音乐作品列表 | ✅ |
| `getChallengeAwemeList` | challengeId, maxCursor?, count? | 获取话题作品列表 | ❌ |
| `getMixAwemeList` | mixId, maxCursor?, count? | 获取合集作品列表 | ❌ |
| `searchAweme` | keyword, cursor?, count?, searchType? | 搜索视频 | ❌ |
| `getUserFollowing` | secUserId, maxTime?, count? | 获取用户关注列表 | ❌ |
| `getUserFollowers` | secUserId, maxTime?, count? | 获取用户粉丝列表 | ✅ |
| `getAllUserAwemes` | secUserId, limit? | 获取用户所有作品 | ❌ |
| `getAllMusicAwemes` | musicId, limit? | 获取音乐所有作品 | ✅ |
| `getAllUserFollowers` | secUserId, limit? | 获取用户所有粉丝 | ✅ |

<!-- ## 如何使用worker和client -->
