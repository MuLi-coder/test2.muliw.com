"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("./game.service");
const deepseek_service_1 = require("../ai/deepseek.service");
let GameController = class GameController {
    games;
    ai;
    constructor(games, ai) {
        this.games = games;
        this.ai = ai;
    }
    create(b) { return this.games.create(b.name || '你', Number(b.count) || 4, b.botNames); }
    get(id) { const g = this.games.get(id); return this.games.publicView(id, g.players[0]?.id); }
    start(id) { return this.games.start(id); }
    choose(id, b) { return this.games.choose(id, b.playerId, b.role); }
    talk(id, b) { return this.games.talk(id, b.playerId, b.text, b.to); }
    offer(id, b) { return this.games.offer(id, b.playerId, b.to, Number(b.give), Number(b.take), b.note); }
    decide(id, offerId, b) { return this.games.decideOffer(id, b.playerId, offerId, !!b.accept); }
    exit(id, b) { return this.games.exit(id, b.playerId); }
    vote(id, b) { return this.games.vote(id, b.playerId); }
    async bots(id, b) { const g = this.games.get(id); for (const bot of g.players.filter(p => !p.isHuman && p.active && !p.escaped)) {
        const move = await this.ai.decide(g, bot, b.baseUrl, b.apiKey, b.model);
        if (g.phase === 'planning' && move.role && !bot.role)
            this.games.choose(id, bot.id, move.role);
        else if (g.phase === 'negotiation') {
            if (move.message)
                this.games.talk(id, bot.id, move.message, move.target);
            if (move.offer)
                this.games.offer(id, bot.id, move.offer.to, move.offer.give, move.offer.take, move.offer.note);
            for (const o of g.offers.filter(o => o.to === bot.id && o.status === 'pending'))
                this.games.decideOffer(id, bot.id, o.id, Math.random() < 0.85);
            if (move.vote && bot.active && !bot.escaped)
                this.games.vote(id, bot.id);
        }
    } return this.games.get(id); }
};
exports.GameController = GameController;
__decorate([
    (0, common_1.Post)('games'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('games/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "get", null);
__decorate([
    (0, common_1.Post)('games/:id/start'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('games/:id/choose'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "choose", null);
__decorate([
    (0, common_1.Post)('games/:id/talk'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "talk", null);
__decorate([
    (0, common_1.Post)('games/:id/offers'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "offer", null);
__decorate([
    (0, common_1.Post)('games/:id/offers/:offerId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('offerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "decide", null);
__decorate([
    (0, common_1.Post)('games/:id/exit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "exit", null);
__decorate([
    (0, common_1.Post)('games/:id/vote'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GameController.prototype, "vote", null);
__decorate([
    (0, common_1.Post)('games/:id/bots'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "bots", null);
exports.GameController = GameController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [game_service_1.GameService, deepseek_service_1.DeepSeekService])
], GameController);
