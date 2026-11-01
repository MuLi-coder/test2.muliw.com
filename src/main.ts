import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
async function bootstrap(){const app=await NestFactory.create<NestExpressApplication>(AppModule);app.useStaticAssets(join(process.cwd(),'public'));app.setGlobalPrefix('');app.enableCors();const port=Number(process.env.PORT||3000);await app.listen(port,'0.0.0.0');console.log(`百万美金已启动：http://localhost:${port}`);}
bootstrap();
