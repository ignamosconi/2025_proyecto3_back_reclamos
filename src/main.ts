import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                // elimina campos extra no definidos en el DTO
      forbidNonWhitelisted: true,     // si mandan un campo desconocido, tiramos error
      transform: true,                // transforma tipos automáticamente
    }),
  );

  await app.listen(3000);
}
bootstrap();
