import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GameService, Role } from './game.service';
import { DeepSeekService } from '../ai/deepseek.service';
@Controller('api')
export class GameController {
 constructor(private readonly games:GameService, private readonly ai:DeepSeekService){}
 @Post('games') create(@Body() b:any){return this.games.create(b.name||'你',Number(b.count)||4,b.botNames);}
 @Get('games/:id') get(@Param('id') id:string){const g=this.games.get(id);return this.games.publicView(id,g.players[0]?.id);}
 @Post('games/:id/start') start(@Param('id') id:string){this.games.start(id);return this.games.publicView(id);}
 @Post('games/:id/choose') choose(@Param('id') id:string,@Body() b:any){return this.games.choose(id,b.playerId,b.role as Role);}
 @Post('games/:id/talk') talk(@Param('id') id:string,@Body() b:any){this.games.talk(id,b.playerId,b.text);return this.games.publicView(id,b.playerId);}
 @Post('games/:id/offers') offer(@Param('id') id:string,@Body() b:any){return this.games.offer(id,b.playerId,b.to,Number(b.give),Number(b.take),b.note);}
 @Post('games/:id/offers/:offerId') decide(@Param('id') id:string,@Param('offerId') offerId:string,@Body() b:any){return this.games.decideOffer(id,b.playerId,offerId,!!b.accept);}
 @Post('games/:id/exit') exit(@Param('id') id:string,@Body() b:any){this.games.exit(id,b.playerId);return this.games.publicView(id,b.playerId);}
 @Post('games/:id/vote') vote(@Param('id') id:string,@Body() b:any){this.games.vote(id,b.playerId);return this.games.publicView(id,b.playerId);}
  @Post('games/:id/settlement/advance') advanceSettlement(@Param('id') id:string){this.games.advanceSettlement(id);return this.games.publicView(id);}
  @Post('games/:id/settlement/continue') continueSettlement(@Param('id') id:string){this.games.continueAfterSettlement(id);return this.games.publicView(id);}
 @Post('games/:id/bots') async bots(@Param('id') id:string,@Body() b:any){const g=this.games.get(id);for(const bot of g.players.filter(p=>!p.isHuman&&p.active&&!p.escaped)){if(g.phase==='finished'||g.phase==='settling'||g.phase==='roundResult')break;const move=await this.ai.decide(g,bot,b.baseUrl||undefined,process.env.DEEPSEEK_API_KEY,b.model||undefined);if(g.phase==='planning'&&move.role&& !bot.role)this.games.choose(id,bot.id,move.role);else if(g.phase==='negotiation'||g.phase==='planning'){if(move.message&&Date.now()-Math.max(0,...g.talks.filter(t=>!g.players.find(p=>p.id===t.from)?.isHuman).map(t=>t.at))>=12000)this.games.talk(id,bot.id,move.message.slice(0,30));if(move.offer)this.games.offer(id,bot.id,move.offer.to,move.offer.give,move.offer.take,move.offer.note);if(move.acceptOffer&&g.offers.some(o=>o.id===move.acceptOffer!.id&&o.to===bot.id&&o.status==='pending'))this.games.decideOffer(id,bot.id,move.acceptOffer.id,!!move.acceptOffer.accept);if(move.vote&&g.phase==='negotiation'&&bot.active&&!bot.escaped)this.games.vote(id,bot.id);}}return this.games.publicView(id,g.players[0]?.id);}
}
