import { Module } from '@nestjs/common';
import { GameController } from './game/game.controller';
import { GameService } from './game/game.service';
import { DeepSeekService } from './ai/deepseek.service';
@Module({controllers:[GameController],providers:[GameService,DeepSeekService]})
export class AppModule {}
