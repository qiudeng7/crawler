import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { DouyinApiClient } from '../douyin/index.js';
import type { RabbitMQConfig } from './client.js';
import { WorkerError, serializeError } from '../douyin/errors.js';

interface WorkerConfig extends RabbitMQConfig {
  queue?: string;
  routingKey?: string;
  douyinCookie: string;
}

interface RequestMessage {
  method: string;
  params: unknown[];
}

interface ResponseMessage {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class RabbitMQWorker {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private config: Required<WorkerConfig>;
  private douyinClient: DouyinApiClient;

  constructor(config: WorkerConfig) {
    this.config = {
      host: config.host || process.env.RABBITMQ_HOST || 'rabbitmq',
      port: config.port || parseInt(process.env.RABBITMQ_PORT || '5672'),
      user: config.user || process.env.RABBITMQ_USER || 'qiudeng',
      pass: config.pass || process.env.RABBITMQ_PASS || 'qiudeng',
      exchange: config.exchange || process.env.RABBITMQ_EXCHANGE || 'douyin',
      queue: config.queue || process.env.RABBITMQ_QUEUE || 'douyin_task',
      routingKey: config.routingKey || process.env.RABBITMQ_ROUTING_KEY || 'douyin_task',
      douyinCookie: config.douyinCookie || process.env.DOUYIN_COOKIE || '',
    };
    this.douyinClient = new DouyinApiClient({ cookie: this.config.douyinCookie });
  }

  async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    const url = `amqp://${this.config.user}:${this.config.pass}@${this.config.host}:${this.config.port}`;
    this.connection = await amqp.connect(url) as ChannelModel;
    this.channel = await this.connection.createChannel();

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

  async setup(): Promise<void> {
    await this.connect();
    const channel = this.channel!;

    // Assert exchange (direct type)
    await channel.assertExchange(this.config.exchange, 'direct', { durable: true });

    // Assert queue
    const queueResult = await channel.assertQueue(this.config.queue, { durable: true });

    // Bind queue to exchange with routing key
    await channel.bindQueue(queueResult.queue, this.config.exchange, this.config.routingKey);

    // Set prefetch to 1 (process one message at a time)
    await channel.prefetch(1);

    console.log(`Worker ready: exchange=${this.config.exchange}, queue=${this.config.queue}, routingKey=${this.config.routingKey}`);
  }

  private async handleMessage(msg: ConsumeMessage): Promise<void> {
    const { replyTo, correlationId } = msg.properties;

    if (!replyTo || !correlationId) {
      console.error('Message missing replyTo or correlationId');
      this.channel!.nack(msg, false, false);
      return;
    }

    let method = '';
    let params: unknown[] = [];

    try {
      const request: RequestMessage = JSON.parse(msg.content.toString());
      method = request.method;
      params = request.params;

      console.log(`Processing request: ${method}`, params);

      // Call the corresponding method on DouyinApiClient
      const result = await (this.douyinClient as any)[method](...params);

      // Send success response
      const response: ResponseMessage = {
        success: true,
        data: result,
      };

      this.channel!.sendToQueue(replyTo, Buffer.from(JSON.stringify(response)), {
        correlationId,
        contentType: 'application/json',
      });

      this.channel!.ack(msg);
      console.log(`Request processed successfully: ${method}`);
    } catch (error) {
      // 创建 WorkerError 包装原始错误
      const workerError = new WorkerError(
        error instanceof Error ? error.message : String(error),
        correlationId,
        method,
        params,
        error instanceof Error ? error : undefined
      );

      // 记录详细错误信息
      console.error(
        `[Worker Error] correlationId=${correlationId}, method=${method}`,
        JSON.stringify(workerError.toJSON(), null, 2)
      );

      // Send error response
      const response: ResponseMessage = {
        success: false,
        error: serializeError(error),
      };

      this.channel!.sendToQueue(replyTo, Buffer.from(JSON.stringify(response)), {
        correlationId,
        contentType: 'application/json',
      });

      this.channel!.ack(msg);
    }
  }

  async start(): Promise<void> {
    await this.setup();
    const channel = this.channel!;

    await channel.consume(
      this.config.queue,
      async (msg) => {
        if (!msg) {
          return;
        }

        await this.handleMessage(msg);
      },
      { noAck: false }
    );

    console.log('Worker started, waiting for messages...');
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.channel = null;
    }
    console.log('Worker stopped');
  }
}
