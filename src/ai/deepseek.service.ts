import { Injectable } from '@nestjs/common';
import { Game, Player, Role } from '../game/game.service';

@Injectable()
export class DeepSeekService {
 async decide(game: Game, bot: Player, baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com', apiKey = process.env.DEEPSEEK_API_KEY, model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'): Promise<{role?:Role; message?:string; target?:string; offer?:{to:string;give:number;take:number;note:string}; vote?:boolean}> {
  const roles=(game as any).availableRoles as Role[]||[];
  const persona=bot.persona||'冷静、重视长期收益，谨慎建立信任';
  const prompt=`你是网页桌游《百万美金》中的玩家，人物设定：${persona}。请基于当前局势做策略决策。语言承诺不产生系统效果，只有接受的交易请求会实际转账。可以撒谎或违约，但人设应影响可信度。只返回 JSON。阶段=${game.phase}，第${game.round}轮，玩家=${JSON.stringify(game.players.map(p=>({id:p.id,name:p.name,cash:p.cash,role:p.id===bot.id?p.role:undefined,active:p.active,escaped:p.escaped})))},卡=${JSON.stringify(game.card)},公开身份=${JSON.stringify(game.revealed)},谈话=${JSON.stringify(game.talks.slice(-12))},待处理交易=${JSON.stringify(game.offers.filter(o=>o.to===bot.id&&o.status==='pending'))}。planning 返回 {"role":"可用角色"}; negotiation 可返回 {"message":"...","target":"玩家ID"} 或 {"offer":{"to":"玩家ID","give":0,"take":0,"note":"..."},"vote":true}。可用角色=${roles.join(',')}。`;
  if(!apiKey)return this.fallback(game,bot,roles);
  try {const res=await fetch(`${baseUrl.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${apiKey}`},body:JSON.stringify({model,temperature:0.8,messages:[{role:'system',content:'你是富有人格的桌游玩家，仅输出合法JSON。'}, {role:'user',content:prompt}]})});if(!res.ok)throw new Error(`DeepSeek HTTP ${res.status}`);const data:any=await res.json();const text=data.choices?.[0]?.message?.content||'{}';return JSON.parse(text.replace(/```json|```/g,'').trim());}catch{return this.fallback(game,bot,roles);}
 }
 private fallback(game:Game,bot:Player,roles:Role[]){if(game.phase==='planning')return{role:roles[Math.floor(Math.random()*roles.length)]};return{message:`${bot.name}：大家怎么看这轮的局势？`,vote:false};}
}
