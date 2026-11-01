import { Controller, Get } from '@nestjs/common';

@Controller('game')
export class RulesController {
  @Get('rules')
  rules() {
    return {
      title: '百万美金', players: '3–8 人（本地单机 1 名人类 + 2–7 名电脑）',
      rounds: 12, lootDeck: '赃款 300–1200 万；保证金 100–500 万；角色奖励 +100 万',
      groups: {
        '3–4': { roles: ['暴徒', '恶棍', '司机'], startingCash: 800, bail: 100, victory: 1500 },
        '5–6': { roles: ['暴徒', '恶棍', '司机', '告密者'], startingCash: 1000, bail: '牌面', victory: 2000 },
        '7–8': { roles: ['暴徒', '恶棍', '司机', '告密者', '谋士'], startingCash: 1200, bail: '牌面', victory: 2000 },
      },
      collision: '同角色两张及以上则该角色玩家撞车；暗置角色和干扰角色均计入判定。',
      settlement: ['谋士 +200 万', '幸存者平分赃款，余数回银行', '司机收取每位在场玩家 100 万车费', '恶棍从暴徒处抢 200 万', '奖励角色 +100 万', '告密者选择淘汰角色或独剩受罚 300 万'],
      aiApiKeyRequired: false,
    };
  }
}
