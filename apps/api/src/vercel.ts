import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

export const createServer = async (expressInstance: any) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
  app.enableCors();
  await app.init();
  return app;
};

// Vercel entry point
let cachedHandler: any;

export default async (req: any, res: any) => {
  if (!cachedHandler) {
    await createServer(server);
    cachedHandler = server;
  }
  return cachedHandler(req, res);
};
