import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { applyResponseEnvelope } from './common/swagger/response-envelope.js';
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
  // browser. Built from the controllers and DTOs, so it never goes stale.
  // Off in production: it should not be public on a real server.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Connect Four API')
      .setVersion('0.1')
      .setDescription(
        [
          'Every success answers `{ "data": ... }`; every failure answers',
          '`{ "error": { "code", "message" } }`.',
          '',
          'Authentication uses one httpOnly cookie, `session`, set by signup and',
          'login and valid for 7 days. The browser sends it automatically, so',
          'frontend requests need `credentials: "include"`. Logging out ends the',
          'session immediately on the server.',
        ].join('\n'),
      )
      // The third argument is the scheme's name in the document. It must match
      // what @ApiCookieAuth('session') refers to on the routes; by default it
      // would be called "cookie" and the routes' lock icons would point at a
      // scheme that does not exist.
      .addCookieAuth(
        'session',
        { type: 'apiKey', in: 'cookie', name: 'session' },
        'session',
      )
      .build();
    // Rewrites the document so every route shows the real { data } / { error }
    // shapes (see common/swagger/response-envelope.ts).
    const document = applyResponseEnvelope(
      SwaggerModule.createDocument(app, config),
    );
    SwaggerModule.setup('docs', app, document, {
      // Puts the page under the global prefix: /api/docs, not /docs.
      useGlobalPrefix: true,
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
