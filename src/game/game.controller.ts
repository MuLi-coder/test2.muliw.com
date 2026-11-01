import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GameService, Role } from './game.service';
import { DeepSeekService } from '../ai/deepseek.service';
@Controller('api')
export class GameController {
 constructor(private readonly games:GameService, private readonly ai:DeepSeekService){}
 @Post('games') create(@Body() b:any){return this.games.create(b.name||'你',Number(b.count)||4,b.botNames);}
 @Get('games/:id') get(@Param('id') id:string){const g=this.games.get(id);return this.games.publicView(id,g.players[0]?.id);}
 @Post('games/:id/start') start(@Param('id') id:string){return this.games.start(id);}
 @Post('games/:id/choose') choose(@Param('id') id:string,@Body() b:any){return this.games.choose(id,b.playerId,b.role as Role);}
 @Post('games/:id/talk') talk(@Param('id') id:string,@Body() b:any){return this.games.talk(id,b.playerId,b.text,b.to);}
 @Post('games/:id/offers') offer(@Param('id') id:string,@Body() b:any){return this.games.offer(id,b.playerId,b.to,Number(b.give),Number(b.take),b.note);}
 @Post('games/:id/offers/:offerId') decide(@Param('id') id:string,@Param('offerId') offerId:string,@Body() b:any){return this.games.decideOffer(id,b.playerId,offerId,!!b.accept);}
 @Post('games/:id/exit') exit(@Param('id') id:string,@Body() b:any){return this.games.exit(id,b.playerId);}
 @Post('games/:id/vote') vote(@Param('id') id:string,@Body() b:any){return this.games.vote(id,b.playerId);}
 @Post('games/:id/bots') async bots(@Param('id') id:string,@Body() b:any){const g=this.games.get(id);for(const bot of g.players.filter(p=>!p.isHuman&&p.active&&!p.escaped)){const move=await this.ai.decide(g,bot,b.baseUrl||undefined,process.env.DEEPSEEK_API_KEY,b.model||undefined);if(g.phase==='planning'&&move.role&& !bot.role)this.games.choose(id,bot.id,move.role);else if(g.phase==='negotiation'){if(move.message)this.games.talk(id,bot.id,move.message,move.target);if(move.offer)this.games.offer(id,bot.id,move.offer.to,move.offer.give,move.offer.take,move.offer.note);for(const o of g.offers.filter(o=>o.to===bot.id&&o.status==='pending'))this.games.decideOffer(id,bot.id,o.id,Math.random()<0.85);if(move.vote&&bot.active&&!bot.escaped)this.games.vote(id,bot.id);}}return this.games.get(id);}
}
