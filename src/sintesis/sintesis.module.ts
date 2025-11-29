// src/sintesis/sintesis.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sintesis, SintesisSchema } from './schemas/sintesis.schema';
import { SintesisRepository } from './repositories/sintesis.repository';
import { ISINTESIS_REPOSITORY } from './repositories/interfaces/sintesis.repository.interface';
import { SintesisService } from './services/sintesis.service';
import { ISINTESIS_SERVICE } from './services/interfaces/sintesis.service.interface';
import { SintesisController } from './controllers/sintesis.controller';
import { UsersModule } from 'src/users/users.module';
import { AreasResponsablesModule } from 'src/areasResponsables/areas-responsables.module';
import { AuthModule } from 'src/auth/auth.module';
import { ReclamoModule } from 'src/reclamo/reclamo.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sintesis.name, schema: SintesisSchema },
    ]),
    UsersModule,
    AreasResponsablesModule,
    AuthModule,
    forwardRef(() => ReclamoModule),
  ],
  controllers: [SintesisController],
  providers: [
    {
      provide: ISINTESIS_REPOSITORY,
      useClass: SintesisRepository,
    },
    {
      provide: ISINTESIS_SERVICE,
      useClass: SintesisService,
    },
    SintesisRepository,
    SintesisService,
  ],
  exports: [
    ISINTESIS_REPOSITORY,
    ISINTESIS_SERVICE,
  ],
})
export class SintesisModule {}

