import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComentarioController } from './controllers/comentario.controller';
import { ComentarioService } from './services/comentario.service';
import { ComentarioRepository } from './repositories/comentario.repository';
import { Comentario, ComentarioSchema } from './schemas/comentario.schema';
import { ReclamoModule } from 'src/reclamo/reclamo.module';
import { AuthModule } from 'src/auth/auth.module';
import { HistorialModule } from 'src/historial/historial.module';
import { UsersModule } from 'src/users/users.module';
import { ICOMENTARIO_REPOSITORY } from './repositories/interfaces/comentario.repository.interface';
import { ICOMENTARIO_SERVICE } from './services/interfaces/comentario.service.interface';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
    ReclamoModule,
    AuthModule,
    HistorialModule,
    UsersModule,
  ],
  controllers: [ComentarioController],
  providers: [
    { provide: ICOMENTARIO_REPOSITORY, useClass: ComentarioRepository },
    { provide: ICOMENTARIO_SERVICE, useClass: ComentarioService },
    ComentarioRepository,
    ComentarioService,
  ],
  exports: [
    ICOMENTARIO_REPOSITORY,
    ICOMENTARIO_SERVICE,
  ],
})
export class ComentarioModule {}

