import { Injectable } from '@nestjs/common';
import { Game, Player, Role } from '../game/game.service';

@Injectable()
export class DeepSeekService {
 async decide(game: Game, bot: Player, baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com', apiKey = process.env.DEEPSEEK_API_KEY, model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'): Promise<{role?:Role; message?:string; target?:string; offer?:{to:string;give:number;take:number;note:string}; vote?:boolean; acceptOffer?:{id:string;accept:boolean}}> {
  const roles=(game as any).availableRoles as Role[]||[];
  const persona=bot.persona||'冷静、重视长期收益，谨慎建立信任';
  const prompt=`你是网页桌游《百万美金》中的玩家，人物设定：${persona}。请基于当前局势做策略决策。语言承诺本身没有系统强制力，但它是判断交易请求的重要依据：回顾双方此前公开对话中的具体承诺、兑现记录和当前请求是否匹配，再结合利益、对方可信度及你的人设决定接受或拒绝，不要一味接受/拒绝；守信型人格通常更重视承诺，机会主义者会权衡收益，骗子可能策略性违约。所有发言都是全桌公开消息。交流频率要克制：只有在有新信息、回应重要承诺或明显局势变化时才发言；每次发言不超过30个汉字，尽量一句话。只返回 JSON。阶段=${game.phase}，第${game.round}轮，玩家=${JSON.stringify(game.players.map(p=>({id:p.id,name:p.name,cash:p.cash,role:p.id===bot.id?p.role:undefined,active:p.active,escaped:p.escaped})))},卡=${JSON.stringify(game.card)},公开身份=${JSON.stringify(game.revealed)},谈话=${JSON.stringify(game.talks.slice(-16))},待处理交易=${JSON.stringify(game.offers.filter(o=>o.to===bot.id&&o.status==='pending'))}。对每项待处理交易，根据相关双方语言协议、对玩家信任、当前利益与人设判断是否接受，acceptOffer 返回交易id与布尔值。planning 返回 {"role":"可用角色"}; negotiation 可返回 {"message":"不超过30字"} 或 {"offer":{"to":"玩家ID","give":0,"take":0,"note":"..."},"acceptOffer":{"id":"...","accept":true},"vote":true}。可用角色=${roles.join(',')}。所有发言均为全桌公聊。`;
  if(!apiKey)return this.fallback(game,bot,roles);
  try {const res=await fetch(`${baseUrl.replace(/\/$/,'')}/chat/completions`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${apiKey}`},body:JSON.stringify({model,temperature:0.8,messages:[{role:'system',content:'你是富有人格的桌游玩家，仅输出合法JSON。'}, {role:'user',content:prompt}]})});if(!res.ok)throw new Error(`DeepSeek HTTP ${res.status}`);const data:any=await res.json();const text=data.choices?.[0]?.message?.content||'{}';const decision=JSON.parse(text.replace(/```json|```/g,'').trim());if(typeof decision.message==='string')decision.message=Array.from(decision.message).slice(0,30).join('');delete decision.target;return decision;}catch{return this.fallback(game,bot,roles);}
 }
 private fallback(game:Game,bot:Player,roles:Role[]){if(game.phase==='planning')return{role:roles[Math.floor(Math.random()*roles.length)]};const last=[...game.talks].reverse().find(t=>!game.players.find(p=>p.id===t.from)?.isHuman);if(last&&Date.now()-last.at<12000)return{vote:false};return{message:'我想听听大家的分配方案。',vote:false};}
}
