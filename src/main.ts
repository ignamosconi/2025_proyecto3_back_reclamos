import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //PIPES
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                // elimina campos extra no definidos en el DTO
      forbidNonWhitelisted: true,     // si mandan un campo desconocido, tiramos error
      transform: true,                // transforma tipos automáticamente
    }),
  );

  //DOCUMENTACIÓN CON SWAGGER
  const config = new DocumentBuilder()
    .setTitle('API de Reclamos')
    .setDescription('Documentación de la API del sistema de reclamos')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);  // La documentación va a estar en: /api

  await app.listen(3000);
}
bootstrap();
