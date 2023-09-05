import path from 'node:path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypegooseModule } from '@m8a/nestjs-typegoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { ChatCenterModule } from './chat-center/chat-center.module';
import { VisitorChannelModule } from './visitor-channel/visitor-channel.module';
import { LeanCloudModule } from './leancloud/leancloud.module';
import { parseRedisUrl } from './redis/utils';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, 'public'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          prefix: 'chat:queue',
          redis: parseRedisUrl(config.getOrThrow('REDIS_URL_QUEUE')),
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true,
          },
        };
      },
    }),
    ScheduleModule.forRoot(),
    TypegooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          uri: config.getOrThrow('MONGODB_URL'),
          autoIndex: false,
          dbName: 'chat',
        };
      },
    }),

    LeanCloudModule,
    RedisModule,
    ChatCenterModule,
    VisitorChannelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
