import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Every route lives under /api (the frontend and its dev proxy expect it).
  app.setGlobalPrefix('api');

  // Reads the Cookie header into `request.cookies`, where the auth guard
  // finds the access token.
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
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config), {
      // Puts the page under the global prefix: /api/docs, not /docs.
      useGlobalPrefix: true,
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
