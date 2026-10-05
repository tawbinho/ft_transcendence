import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Every route lives under /api (the frontend and its dev proxy expect it).
  app.setGlobalPrefix('api');

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
