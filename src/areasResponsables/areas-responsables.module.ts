import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AreasResponsablesController } from './areas-responsables.controller';
import { AreasResponsablesService } from './areas-responsables.service';
import { AreasResponsablesRepository } from './areas-responsables.repository';
import { Area, AreaSchema } from './schemas/area.schema';

import {IAREAS_RESPONSABLES_REPOSITORY} from './interfaces/areas-responsables.repository.interface';
import {IAREAS_RESPONSABLES_SERVICE} from './interfaces/areas-responsables.service.interface';



@Module({
  imports: [
    MongooseModule.forFeature([{ name: Area.name, schema: AreaSchema }]),
  ],
  controllers: [AreasResponsablesController],
  providers: [
    {
      provide: IAREAS_RESPONSABLES_REPOSITORY,
      useClass: AreasResponsablesRepository,
    },
    {
      provide: IAREAS_RESPONSABLES_SERVICE,
      useClass: AreasResponsablesService,
    },
  ],
  exports: [
    IAREAS_RESPONSABLES_REPOSITORY,
    IAREAS_RESPONSABLES_SERVICE,
  ],
})

export class AreasResponsablesModule {}