// src/seeders/master.seeder.ts
import { NestFactory } from '@nestjs/core';
import { AreasSeeder } from './areas.seeder';
import { IAREAS_RESPONSABLES_SERVICE } from '../areasResponsables/interfaces/areas-responsables.service.interface';
import type { IAreasResponsablesService } from '../areasResponsables/interfaces/areas-responsables.service.interface';
import { TipoReclamoSeeder } from './tipo-reclamo.seeder';
import { ITIPO_RECLAMO_SERVICE, ITipoReclamoService } from '../tipoReclamo/interfaces/tipo-reclamo.service.interface';
import { AppModule } from 'src/app.module';

async function runSeeders() {
  console.log('###########################################');
  console.log('Iniciando seeders...');

  // Levantamos solo el SeedersModule
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('###########################################');
  //ÁREA-RECLAMO
  const areasService = app.get<IAreasResponsablesService>(IAREAS_RESPONSABLES_SERVICE);
  const seederAreas = new AreasSeeder(areasService);
  await seederAreas.run();

  //TIPO-RECLAMO
  const tipoReclamoService = app.get<ITipoReclamoService>(ITIPO_RECLAMO_SERVICE);
  const seederTipo = new TipoReclamoSeeder(tipoReclamoService);
  await seederTipo.run();

  console.log('###########################################');
  console.log('Seeders finalizados.');

  await app.close();
}

runSeeders()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
