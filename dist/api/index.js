"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = __importDefault(require("express"));
const node_path_1 = require("node:path");
const app_module_1 = require("../src/app.module");
let cached;
async function createServer() {
    const server = (0, express_1.default)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server), { bodyParser: true, logger: ['error', 'warn'] });
    app.enableCors();
    await app.init();
    return server;
}
async function handler(req, res) {
    cached ??= createServer();
    const server = await cached;
    // The client bundle is served from public/, while API requests are handled by the Nest app.
    if (req.path === '/' || req.path === '/index.html' || req.path.startsWith('/style.css') || req.path.startsWith('/app.js')) {
        const asset = req.path === '/' ? '/index.html' : req.path;
        return res.sendFile((0, node_path_1.join)(process.cwd(), 'public', asset.slice(1)));
    }
    return server(req, res);
}
