"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const node_path_1 = require("node:path");
const app_module_1 = require("./app.module");
async function bootstrap() { const app = await core_1.NestFactory.create(app_module_1.AppModule); app.useStaticAssets((0, node_path_1.join)(process.cwd(), 'public')); app.setGlobalPrefix(''); app.enableCors(); const port = Number(process.env.PORT || 3000); await app.listen(port, '0.0.0.0'); console.log(`百万美金已启动：http://localhost:${port}`); }
bootstrap();
