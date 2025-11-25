import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProyectoModule } from './proyecto/proyecto.module';
import { AreasResponsablesModule } from './areasResponsables/areas-responsables.module';
import { TipoReclamoModule } from './tipoReclamo/tipo-reclamo.module';
import { UsersModule } from './users/users.module';
import { MailerModule } from './mailer/mailer.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // carga .env
    MongooseModule.forRootAsync({
      imports: [
        ConfigModule,
        ProyectoModule
      ],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),

    //Módulos 
    AreasResponsablesModule,
    TipoReclamoModule,
    UsersModule,
    MailerModule,
    AuthModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}