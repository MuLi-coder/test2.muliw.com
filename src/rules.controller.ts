import { Controller, Get } from '@nestjs/common';

@Controller('game')
export class RulesController {
  @Get('rules')
  rules() {
    return {
      title: '开车分账', players: '你 + 2–5 名电脑玩家', startingCash: 100,
      initialVehicleValue: 120, rounds: 3, vehicleBonusPerRound: 15,
      settlement: '总池按 1 + floor(余额 / 50) 权重分配，最大余数法处理余数。',
      aiApiKeyRequired: false,
    };
  }
}
