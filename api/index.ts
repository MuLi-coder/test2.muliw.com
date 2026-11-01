import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';

let cached: Express | undefined;
let initializing: Promise<Express> | undefined;

async function createApp(): Promise<Express> {
  const server = express();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(server), { logger: false });
  app.setGlobalPrefix('api');
  await app.init();
  return server;
}

export default async function handler(req: any, res: any) {
  try {
    if (!cached) {
      initializing ??= createApp();
      cached = await initializing;
    }
    cached(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Application initialization failed' });
  }
}
