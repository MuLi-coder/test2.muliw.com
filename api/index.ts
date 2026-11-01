import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';

let cached: Promise<Express> | undefined;
async function createServer(): Promise<Express> {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { bodyParser: true, logger: ['error', 'warn'] });
  app.enableCors();
  await app.init();
  return server;
}
export default async function handler(req: express.Request, res: express.Response) {
  cached ??= createServer();
  const server = await cached;
  // The client bundle is served from public/, while API requests are handled by the Nest app.
  if (req.path === '/' || req.path === '/index.html' || req.path.startsWith('/style.css') || req.path.startsWith('/app.js')) {
    const asset = req.path === '/' ? '/index.html' : req.path;
    return res.sendFile(join(process.cwd(), 'public', asset.slice(1)));
  }
  return server(req, res);
}
