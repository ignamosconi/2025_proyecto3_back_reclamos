import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TipoReclamoController } from './tipo-reclamo.controller';
import { TipoReclamoService } from './tipo-reclamo.service';
import { TipoReclamoRepository } from './tipo-reclamo.repository';
import { TipoReclamo, TipoReclamoSchema } from './schemas/tipo-reclamo.schema';
import { ITIPO_RECLAMO_REPOSITORY } from './interfaces/tipo-reclamo.repository.interface';
import { ITIPO_RECLAMO_SERVICE } from './interfaces/tipo-reclamo.service.interface';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TipoReclamo.name, schema: TipoReclamoSchema }]),
    AuthModule,
  ],
  controllers: [TipoReclamoController],
  providers: [
    { provide: ITIPO_RECLAMO_REPOSITORY, useClass: TipoReclamoRepository },
    { provide: ITIPO_RECLAMO_SERVICE, useClass: TipoReclamoService },
  ],
  exports: [ITIPO_RECLAMO_REPOSITORY, ITIPO_RECLAMO_SERVICE],
})
export class TipoReclamoModule {}
