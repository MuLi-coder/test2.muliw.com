import { Module } from '@nestjs/common';
import { GameController } from './game/game.controller';
import { GameService } from './game/game.service';
import { DeepSeekService } from './ai/deepseek.service';
import { RedisStore } from './game/redis.store';
import { GamePersistenceInterceptor } from './game/game-persistence.interceptor';
@Module({controllers:[GameController],providers:[GameService,DeepSeekService,RedisStore,GamePersistenceInterceptor]})
export class AppModule {}
