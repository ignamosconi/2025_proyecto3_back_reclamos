/*
  PARA EJECUTAR EL SEEDER, CORRER EL SIGUIENTE COMANDO:
  npm run seed
*/

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

import { AreasSeeder } from './areas.seeder';
import { TipoReclamoSeeder } from './tipo-reclamo.seeder';
import { UsersSeeder } from './users.seeder';

import { IAREAS_RESPONSABLES_REPOSITORY } from '../areasResponsables/interfaces/areas-responsables.repository.interface';
import { ITIPO_RECLAMO_REPOSITORY } from '../tipoReclamo/interfaces/tipo-reclamo.repository.interface';
import { IUSERS_REPOSITORY } from '../users/interfaces/users.repository.interface';
import { ProyectosSeeder } from './proyecto.seeder';

async function runSeeders() {
  console.log('Iniciando seeders con repositories...');

  const app = await NestFactory.createApplicationContext(AppModule);
  // Repositories
  const areasRepo = app.get(IAREAS_RESPONSABLES_REPOSITORY);
  const tipoRepo = app.get(ITIPO_RECLAMO_REPOSITORY);
  const usersRepo = app.get(IUSERS_REPOSITORY);
  const proyectosRepo = app.get('IProyectosRepository');

  
  // Ejecutar seeders
  console.log('###########################################');
  await new AreasSeeder(areasRepo).run();
  await new TipoReclamoSeeder(tipoRepo).run();
  await new UsersSeeder(usersRepo, areasRepo).run();
  await new ProyectosSeeder(proyectosRepo, usersRepo, areasRepo).run()
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
