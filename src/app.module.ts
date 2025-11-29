import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProyectosModule } from './proyectos/proyecto.module';
import { AreasResponsablesModule } from './areasResponsables/areas-responsables.module';
import { TipoReclamoModule } from './tipoReclamo/tipo-reclamo.module';
import { UsersModule } from './users/users.module';
import { MailerModule } from './mailer/mailer.module';
import { AuthModule } from './auth/auth.module';
import { ReclamoModule } from './reclamo/reclamo.module';
import { EncuestaModule } from './encuesta/encuesta.module';
import { SintesisModule } from './sintesis/sintesis.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ComentarioModule } from './comentario/comentario.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // carga .env
    MongooseModule.forRootAsync({
      imports: [
        ConfigModule,
        ProyectosModule
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
    ProyectosModule,
    MailerModule,
    AuthModule,
    ReclamoModule,
    EncuestaModule,
    SintesisModule,
    DashboardModule,
    ComentarioModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}