import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EncuestaController } from './controllers/encuesta.controller';
import { EncuestasController } from './controllers/encuestas.controller';
import { EncuestaService } from './services/encuesta.service';
import { EncuestaRepository } from './repositories/encuesta.repository';
import { Encuesta, EncuestaSchema } from './schemas/encuesta.schema';
import { IENCUESTA_REPOSITORY } from './repositories/interfaces/encuesta.repository.interface';
import { IENCUESTA_SERVICE } from './services/interfaces/encuesta.service.interface';
import { ReclamoModule } from 'src/reclamo/reclamo.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Encuesta.name, schema: EncuestaSchema },
    ]),
    ReclamoModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [EncuestaController, EncuestasController],
  providers: [
    {
      provide: IENCUESTA_REPOSITORY,
      useClass: EncuestaRepository,
    },
    {
      provide: IENCUESTA_SERVICE,
      useClass: EncuestaService,
    },
  ],
  exports: [IENCUESTA_REPOSITORY, IENCUESTA_SERVICE],
})
export class EncuestaModule {}

