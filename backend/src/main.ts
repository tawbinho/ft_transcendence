import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // The backend sits behind the HTTPS proxy (see proxy/nginx.conf). Trust ONE
  // proxy hop, so `request.ip` is the real client address taken from the
  // X-Forwarded-For header the proxy sets. Without this, every request would
  // look like it comes from the proxy and all users would share one rate
  // limit. The proxy overwrites that header, so clients cannot spoof it.
  app.set('trust proxy', 1);

  // Every route lives under /api (the frontend and its dev proxy expect it).
  app.setGlobalPrefix('api');

  // Reads the Cookie header into `request.cookies`, where the auth guard
  // finds the session token.
  app.use(cookieParser());

  // Every failure leaves as { error: { code, message } }.
  app.useGlobalFilters(new AllExceptionsFilter());
  // Every success leaves as { data }.
  app.useGlobalInterceptors(new ResponseInterceptor());
  // Checks every request body against its DTO rules before it reaches a
  // controller. `whitelist` drops fields the DTO does not declare,
  // `forbidNonWhitelisted` rejects the request if such fields are sent, and
  // `transform` turns the raw JSON into a real DTO instance.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
