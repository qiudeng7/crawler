import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { randomUUID } from 'node:crypto';

export interface RabbitMQConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  exchange?: string;
}

// Request message types
interface RequestMessage {
  method: string;
  params: unknown[];
}

// Response message types
interface ResponseMessage {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class DouyinClient {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private config: Required<RabbitMQConfig>;
  private responseQueue: string;
  private correlationMaps: Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>;
  private consumerTag: string | null = null;

  constructor(config: RabbitMQConfig = {}) {
    this.config = {
      host: config.host || process.env.RABBITMQ_HOST || 'localhost',
      port: config.port || parseInt(process.env.RABBITMQ_PORT || '5672'),
      user: config.user || process.env.RABBITMQ_USER || 'qiudeng',
      pass: config.pass || process.env.RABBITMQ_PASS || 'qiudeng',
      exchange: config.exchange || process.env.RABBITMQ_EXCHANGE || 'douyin',
    };
    this.responseQueue = 'douyin_response';
    this.correlationMaps = new Map();
  }

  private async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    const url = `amqp://${this.config.user}:${this.config.pass}@${this.config.host}:${this.config.port}`;
    this.connection = await amqp.connect(url) as ChannelModel;
    this.channel = await this.connection.createChannel();

    // Setup response queue (exclusive for this client)
    const queueResult = await this.channel.assertQueue('', { exclusive: true });
    this.responseQueue = queueResult.queue;

    // Start consuming responses
    await this.channel.consume(
      this.responseQueue,
      (msg: ConsumeMessage | null) => {
        if (!msg) return;

        const correlationId = msg.properties.correlationId;
        if (correlationId && this.correlationMaps.has(correlationId)) {
          const { resolve, reject } = this.correlationMaps.get(correlationId)!;
          this.correlationMaps.delete(correlationId);

          try {
            const response: ResponseMessage = JSON.parse(msg.content.toString());
            if (response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || 'Unknown error'));
            }
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        }

        this.channel!.ack(msg);
      },
      { noAck: false }
    );

    this.connection.on('error', (err: Error) => {
      console.error('RabbitMQ connection error:', err);
    });

    this.connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      this.connection = null;
      this.channel = null;
    });

    console.log(`Connected to RabbitMQ at ${this.config.host}:${this.config.port}`);
  }

  private async sendRequest(method: string, params: unknown[]): Promise<unknown> {
    await this.connect();

    const correlationId = randomUUID();
    const message: RequestMessage = { method, params };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.correlationMaps.delete(correlationId);
        reject(new Error('Request timeout'));
      }, 30000); // 30 seconds timeout

      this.correlationMaps.set(correlationId, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      this.channel!.publish(
        this.config.exchange,
        'douyin_task',
        Buffer.from(JSON.stringify(message)),
        {
          correlationId,
          replyTo: this.responseQueue,
          contentType: 'application/json',
        }
      );
    });
  }

  async getAwemeDetail(awemeId: string): Promise<unknown> {
    return this.sendRequest('getAwemeDetail', [awemeId]);
  }

  async getUserAwemeList(secUserId: string, cursor: number = 0): Promise<unknown> {
    return this.sendRequest('getUserAwemeList', [secUserId, cursor]);
  }

  async getUserFavoriteList(secUserId: string, cursor: number = 0): Promise<unknown> {
    return this.sendRequest('getUserFavoriteList', [secUserId, cursor]);
  }

  async getUserCollectionList(secUserId: string, cursor: number = 0): Promise<unknown> {
    return this.sendRequest('getUserCollectionList', [secUserId, cursor]);
  }

  async getMusicAwemeList(musicId: string, cursor: number = 0): Promise<unknown> {
    return this.sendRequest('getMusicAwemeList', [musicId, cursor]);
  }

  async getChallengeAwemeList(challengeId: string, cursor: number = 0): Promise<unknown> {
    return this.sendRequest('getChallengeAwemeList', [challengeId, cursor]);
  }

  async getMixAwemeList(mixId: string, cursor: number = 0): Promise<unknown> {
    return this.sendRequest('getMixAwemeList', [mixId, cursor]);
  }

  async searchAweme(keyword: string, cursor: number = 0, count: number = 20, searchType: number = 0): Promise<unknown> {
    return this.sendRequest('searchAweme', [keyword, cursor, count, searchType]);
  }

  async getUserFollowing(secUserId: string, cursor: number = 0): Promise<unknown> {
    return this.sendRequest('getUserFollowing', [secUserId, cursor]);
  }

  async getUserFollowers(secUserId: string, cursor: number = 0): Promise<unknown> {
    return this.sendRequest('getUserFollowers', [secUserId, cursor]);
  }

  async getAllUserAwemes(secUserId: string, limit: number = 0): Promise<unknown> {
    return this.sendRequest('getAllUserAwemes', [secUserId, limit]);
  }

  async getAllMusicAwemes(musicId: string, limit: number = 0): Promise<unknown> {
    return this.sendRequest('getAllMusicAwemes', [musicId, limit]);
  }

  async getAllUserFollowers(secUserId: string, limit: number = 0): Promise<unknown> {
    return this.sendRequest('getAllUserFollowers', [secUserId, limit]);
  }

  async close(): Promise<void> {
    if (this.channel && this.consumerTag) {
      await this.channel.cancel(this.consumerTag);
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.channel = null;
    }
  }
}
