import { Global, Module } from '@nestjs/common';
import { RedisModule as IORedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    IORedisModule.forRootAsync({
      inject: [Logger, ConfigService],
      useFactory: (logger: Logger, configService: ConfigService) => ({
        type: 'single',
        options: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT') ?? 6379,
          db: 0,
          lazyConnect: true, //
          maxRetriesPerRequest: null,
          retryStrategy(times) {
            const delay = 5000;
            logger.warn({
              context: 'RedisModule',
              attempt: times,
              nextRetryIn: '5s',
              msg: 'Redis connection lost. Retrying...',
            });
            return delay;
          },
        },
        onClientReady: (client) => {
          client.on('ready', () => {
            logger.log({
              context: 'RedisModule',
              msg: 'Redis client connected successfully and is ready.',
            });
          });

          client.on('error', (err) => {
            logger.warn({
              message: err,
              context: 'RedisModule',
              msg: 'Redis connection failed. Fallback to Database.',
            });
          });
        },
      }),
    }),
  ],
  exports: [IORedisModule],
})
export class RedisModule {}
