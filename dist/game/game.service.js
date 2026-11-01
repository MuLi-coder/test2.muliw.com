"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const roles = ['告密者', '暴徒', '司机', '恶棍', '谋士'];
const cards = [{ loot: 300, deposit: 100, reward: '司机' }, { loot: 400, deposit: 100, reward: '暴徒' }, { loot: 500, deposit: 200, reward: '恶棍' }, { loot: 500, deposit: 100, reward: '司机' }, { loot: 600, deposit: 200, reward: '暴徒' }, { loot: 600, deposit: 300, reward: '告密者' }, { loot: 700, deposit: 200, reward: '谋士' }, { loot: 700, deposit: 300, reward: '恶棍' }, { loot: 800, deposit: 300, reward: '司机' }, { loot: 900, deposit: 400, reward: '暴徒' }, { loot: 1000, deposit: 400, reward: '谋士' }, { loot: 1200, deposit: 500, reward: '告密者' }];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
} return a; };
let GameService = class GameService {
    games = new Map();
    create(humanName = '你', count = 4, bots) { if (count < 3 || count > 8)
        throw new common_1.BadRequestException('人数必须为 3–8 人'); const g = { id: (0, node_crypto_1.randomUUID)(), phase: 'lobby', round: 0, players: [], deck: shuffle([...cards]), talks: [], offers: [], revealed: [], hiddenCount: 0, log: [], launchVotes: [], createdAt: Date.now() }; g.players.push(this.player('human', humanName, true)); for (let i = 1; i < count; i++)
        g.players.push(this.player(`bot-${i}`, bots?.[i - 1] || ['冷静的老手', '贪婪的机会主义者', '守信的谈判家', '多疑的观察者', '胆大的赌徒', '沉默的策士', '圆滑的骗子'][i - 1] || `搭档 ${i}`, false)); this.games.set(g.id, g); return g; }
    player(id, name, isHuman) { return { id, name, isHuman, cash: 0, active: true, escaped: false, roundsSurvived: 0, trust: {} }; }
    get(id) { const g = this.games.get(id); if (!g)
        throw new common_1.NotFoundException('游戏不存在'); return g; }
    publicView(id, pid) { const g = this.get(id); return this.view(g, pid); }
    start(id) { const g = this.get(id); if (g.phase !== 'lobby')
        throw new common_1.BadRequestException('游戏已开始'); const n = g.players.length; const roleSet = n <= 4 ? ['暴徒', '恶棍', '司机'] : n <= 6 ? ['暴徒', '恶棍', '司机', '告密者'] : roles; g.players.forEach(p => p.cash = n <= 4 ? 800 : n <= 6 ? 1000 : 1200); g.deck = shuffle([...cards]); g.round = 0; g.phase = 'planning'; g.log.push('游戏开始：每人拥有 ' + (n <= 4 ? 800 : n <= 6 ? 1000 : 1200) + ' 万。'); this.nextRound(g, roleSet); return g; }
    nextRound(g, roleSet) { if (!g.deck.length) {
        g.phase = 'finished';
        this.endGame(g);
        return;
    } g.round++; g.card = g.deck.pop(); g.players.forEach(p => { p.role = undefined; p.active = true; p.escaped = false; }); g.revealed = []; g.hiddenCount = 0; g.launchVotes = []; g.talks = []; g.offers = []; g.phase = 'planning'; g.log.push(`第 ${g.round} 轮：赃款 ${g.card.loot} 万，保证金 ${g.players.length <= 4 ? 100 : g.card.deposit} 万，奖励 ${g.card.reward}。`); g.availableRoles = roleSet; }
    choose(id, pid, role) { const g = this.get(id), p = this.person(g, pid); if (g.phase !== 'planning')
        throw new common_1.BadRequestException('当前不是选角阶段'); if (!g.availableRoles.includes(role))
        throw new common_1.BadRequestException('不可用角色'); if (p.cash < (g.players.length <= 4 ? 100 : g.card.deposit))
        throw new common_1.BadRequestException('现金不足以支付保证金'); p.role = role; p.cash -= g.players.length <= 4 ? 100 : g.card.deposit; if (g.players.every(x => x.role)) {
        const pool = g.players.map(x => x.role);
        if (g.players.length >= 7)
            pool.push(g.availableRoles[Math.floor(Math.random() * g.availableRoles.length)]);
        shuffle(pool);
        const shown = pool.slice(0, g.players.length - 1);
        g.revealed = shown;
        g.hiddenCount = pool.length - shown.length;
        g.phase = 'negotiation';
        g.log.push('身份牌已混洗并揭示；暗牌身份仍参与结算。');
    } return this.view(g, pid); }
    view(g, pid) { return { ...g, players: g.players.map(p => ({ ...p, role: pid === p.id || g.phase === 'finished' ? p.role : undefined, trust: undefined })), hiddenCount: g.hiddenCount, availableRoles: g.availableRoles }; }
    person(g, pid) { const p = g.players.find(x => x.id === pid); if (!p)
        throw new common_1.NotFoundException('玩家不存在'); return p; }
    talk(id, pid, text, to) { const g = this.get(id); if (g.phase !== 'negotiation')
        throw new common_1.BadRequestException('谈判尚未开始或已结束'); if (!text.trim())
        throw new common_1.BadRequestException('发言不能为空'); if (to)
        this.person(g, to); g.talks.push({ from: pid, to, text: text.slice(0, 500), at: Date.now() }); return g; }
    offer(id, pid, to, give, take, note = '') { const g = this.get(id); if (g.phase !== 'negotiation')
        throw new common_1.BadRequestException('交易仅可在发车前发起'); if (pid === to)
        throw new common_1.BadRequestException('不能向自己发起交易'); const a = this.person(g, pid), b = this.person(g, to); if (!a.active || !b.active || a.escaped || b.escaped)
        throw new common_1.BadRequestException('仅可向仍参与本轮的玩家交易'); if (!Number.isInteger(give) || !Number.isInteger(take) || give < 0 || take < 0 || give > a.cash || take > b.cash)
        throw new common_1.BadRequestException('交易金额不合法或现金不足'); const o = { id: (0, node_crypto_1.randomUUID)(), from: pid, to, give, take, note: note.slice(0, 240), status: 'pending' }; g.offers.push(o); return o; }
    decideOffer(id, pid, offerId, accept) { const g = this.get(id); if (g.phase !== 'negotiation')
        throw new common_1.BadRequestException('交易阶段已结束'); const o = g.offers.find(x => x.id === offerId); if (!o)
        throw new common_1.NotFoundException('交易请求不存在'); if (o.to !== pid || o.status !== 'pending')
        throw new common_1.BadRequestException('无权处理此请求'); o.status = accept ? 'accepted' : 'rejected'; if (accept) {
        const a = this.person(g, o.from), b = this.person(g, o.to);
        if (a.cash < o.give || b.cash < o.take)
            throw new common_1.BadRequestException('接受时余额已变化，请重新发起');
        a.cash = a.cash - o.give + o.take;
        b.cash = b.cash - o.take + o.give;
        g.log.push(`${a.name} 与 ${b.name} 的即时交易已执行。`);
    } return o; }
    exit(id, pid) { const g = this.get(id), p = this.person(g, pid); if (g.phase !== 'negotiation' || !p.active)
        throw new common_1.BadRequestException('当前不可退出'); p.active = false; p.escaped = true; p.cash += g.players.length <= 4 ? 100 : g.card.deposit; g.log.push(`${p.name} 退出本轮并取回保证金。`); return g; }
    vote(id, pid) { const g = this.get(id), p = this.person(g, pid); if (g.phase !== 'negotiation' || !p.active || p.escaped)
        throw new common_1.BadRequestException('当前不能确认发车'); if (!g.launchVotes.includes(pid))
        g.launchVotes.push(pid); if (g.players.filter(x => x.active && !x.escaped).every(x => g.launchVotes.includes(x.id)))
        return this.resolve(g); return g; }
    resolve(g) {
        g.phase = 'finished';
        const contenders = g.players.filter(p => p.active && !p.escaped);
        const counts = new Map();
        for (const p of contenders)
            if (p.role)
                counts.set(p.role, (counts.get(p.role) || 0) + 1);
        const crashed = new Set();
        for (const [r, c] of counts)
            if (c >= 2)
                crashed.add(r);
        for (const p of contenders) {
            if (p.role === '暴徒') {
                p.cash += g.players.length <= 4 ? 100 : g.card.deposit;
            }
            else if (p.role && counts.get(p.role) === 1) {
                p.cash += g.players.length <= 4 ? 100 : g.card.deposit;
                p.roundsSurvived++;
            }
            else if (p.role && crashed.has(p.role)) {
                p.active = false;
            }
        }
        let survivors = contenders.filter(p => p.active && !crashed.has(p.role));
        let loot = g.card.loot;
        if (survivors.some(p => p.role === '谋士'))
            loot += 200;
        const share = survivors.length ? Math.floor(loot / survivors.length) : 0;
        for (const p of survivors)
            p.cash += share;
        const driver = survivors.find(p => p.role === '司机');
        if (driver)
            for (const p of g.players.filter(x => x.id !== driver.id && !x.escaped)) {
                const fee = Math.min(100, p.cash);
                p.cash -= fee;
                driver.cash += fee;
            }
        const mobster = g.players.find(p => p.role === '暴徒' && !p.escaped);
        const villain = survivors.find(p => p.role === '恶棍');
        if (villain && mobster && mobster.id !== villain.id) {
            const stolen = Math.min(200, mobster.cash);
            mobster.cash -= stolen;
            villain.cash += stolen;
        }
        for (const p of survivors)
            if (p.role === g.card.reward)
                p.cash += 100;
        const snitch = survivors.find(p => p.role === '告密者');
        if (snitch) {
            const remain = survivors.filter(p => p !== snitch);
            if (!remain.length)
                snitch.cash = Math.max(0, snitch.cash - 300);
            else {
                const pick = [...new Set(remain.map(p => p.role))][0];
                for (const p of remain)
                    if (p.role === pick)
                        p.active = false;
            }
        }
        g.log.push(`结算完成：${survivors.length} 名玩家成功留车，基础分赃每人 ${share} 万。`);
        const threshold = g.players.length <= 4 ? 1500 : 2000;
        const winners = g.players.filter(p => p.cash >= threshold);
        if (winners.length) {
            const top = Math.max(...winners.map(p => p.cash));
            g.winner = winners.filter(p => p.cash === top).map(p => p.id);
            g.phase = 'finished';
        }
        else if (!g.deck.length) {
            this.endGame(g);
            return g;
        }
        else {
            const rolesNow = g.availableRoles;
            this.nextRound(g, rolesNow);
        }
        return g;
    }
    endGame(g) { const top = Math.max(...g.players.map(p => p.cash)); const rich = g.players.filter(p => p.cash === top); const wins = Math.max(...rich.map(p => p.roundsSurvived)); g.winner = rich.filter(p => p.roundsSurvived === wins).map(p => p.id); g.phase = 'finished'; g.log.push('牌堆耗尽，按现金与成功留车轮数判定胜者。'); }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)()
], GameService);
