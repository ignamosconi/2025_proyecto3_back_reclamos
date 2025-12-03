import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // CORS Configuration - origins from environment variables
  const corsOrigins = configService
    .get<string>(
      'CORS_ORIGINS',
      'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173',
    )
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  //PIPES
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos extra no definidos en el DTO
      forbidNonWhitelisted: true, // si mandan un campo desconocido, tiramos error
      transform: true, // transforma tipos automáticamente
    }),
  );

  //DOCUMENTACIÓN CON SWAGGER
  const config = new DocumentBuilder()
    .setTitle('API de Reclamos')
    .setDescription('Documentación de la API del sistema de reclamos')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // La documentación va a estar en: /api/docs

  await app.listen(configService.get<number>('PORT', 3000));
}
bootstrap();
