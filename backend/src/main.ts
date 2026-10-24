import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import cookieParser from 'cookie-parser';
import type { Express } from 'express';
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

  // Interactive API page at /api/docs, to try routes by hand from the
  // browser. It shows the hand-written contract in docs/openapi.yaml (Swagger
  // UI is loaded from a CDN, so no extra package). Off in production.
  if (process.env.NODE_ENV !== 'production') {
    const http = app.getHttpAdapter().getInstance() as Express;
    http.get('/api/docs/openapi.yaml', async (_req, res) => {
      const yaml = await readFile(join(process.cwd(), 'docs/openapi.yaml'));
      res.type('text/yaml').send(yaml);
    });
    http.get('/api/docs', (_req, res) => {
      res.type('html').send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Connect Four API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  </head>
  <body>
    <div id="ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({ url: '/api/docs/openapi.yaml', dom_id: '#ui' });
    </script>
  </body>
</html>`);
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
