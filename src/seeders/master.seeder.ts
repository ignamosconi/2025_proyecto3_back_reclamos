/*
    ESTE ARCHIVO PERMITE EJECUTAR TODOS LOS SEEDERS DEFINIDOS EN <src/seeders>

    SE EJECUTA CON: npm run seed
*/

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AreasSeeder } from './areas.seeder';
import { IAREAS_RESPONSABLES_SERVICE } from '../areasResponsables/interfaces/areas-responsables.service.interface';
import type { IAreasResponsablesService } from '../areasResponsables/interfaces/areas-responsables.service.interface';

async function runSeeders() {
  console.log('Iniciando seeders...');
  console.log('###########################################');

  // Creamos una instancia de la app de Nest
  const app = await NestFactory.createApplicationContext(AppModule);

  // Obtenemos el service desde el contenedor de Nest usando la interfaz
  const areasService = app.get<IAreasResponsablesService>(IAREAS_RESPONSABLES_SERVICE);

  // Creamos el seeder con el service
  const seeder = new AreasSeeder(areasService);
  await seeder.run();
  console.log('###########################################');
  console.log('Seeders finalizados.');

  await app.close();
}

runSeeders()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
