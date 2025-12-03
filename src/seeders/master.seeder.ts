/*
  PARA EJECUTAR EL SEEDER, CORRER EL SIGUIENTE COMANDO:
  npm run seed
*/

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { AreasSeeder } from './areas.seeder';
import { TipoReclamoSeeder } from './tipo-reclamo.seeder';
import { UsersSeeder } from './users.seeder';

import { IAREAS_RESPONSABLES_REPOSITORY } from '../areasResponsables/interfaces/areas-responsables.repository.interface';
import { ITIPO_RECLAMO_REPOSITORY } from '../tipoReclamo/interfaces/tipo-reclamo.repository.interface';
import { IUSERS_REPOSITORY } from '../users/interfaces/users.repository.interface';
import { ProyectosSeeder } from './proyecto.seeder';
import { ReclamosSeeder } from './reclamos.seeder';
import { HistorialReclamosSeeder } from './historial-reclamos.seeder';
import { EncuestaSeeder } from './encuesta.seeder';
import { SintesisSeeder } from './sintesis.seeder';
import { ComentarioSeeder } from './comentario.seeder';
import { ReclamoEncargadoSeeder } from './reclamo-encargado.seeder';
import { ImagenSeeder } from './imagen.seeder';
import { HistorialRepository } from '../historial/historial.repository';
import { IENCUESTA_REPOSITORY } from '../encuesta/repositories/interfaces/encuesta.repository.interface';
import { ISINTESIS_REPOSITORY } from '../sintesis/repositories/interfaces/sintesis.repository.interface';
import { ICOMENTARIO_REPOSITORY } from '../comentario/repositories/interfaces/comentario.repository.interface';
import { IImagenRepository } from '../reclamo/repositories/interfaces/imagen.repository.interface';

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
  await new ProyectosSeeder(proyectosRepo, usersRepo, areasRepo).run();

  // Nuevos seeders
  const reclamoRepo = app.get('IReclamoRepository');
  const historialRepo = app.get(HistorialRepository);
  const encuestaRepo = app.get(IENCUESTA_REPOSITORY);
  const sintesisRepo = app.get(ISINTESIS_REPOSITORY);
  const comentarioRepo = app.get(ICOMENTARIO_REPOSITORY);

  await new ReclamosSeeder(reclamoRepo, proyectosRepo, usersRepo, tipoRepo).run();
  
  // Nuevos seeders de relaciones
  const reclamoEncargadoRepo = app.get('IReclamoEncargadoRepository');
  const imagenRepo = app.get(IImagenRepository);
  
  await new ReclamoEncargadoSeeder(reclamoEncargadoRepo, reclamoRepo, usersRepo).run();
  await new HistorialReclamosSeeder(historialRepo, reclamoRepo, reclamoEncargadoRepo).run();
  await new ImagenSeeder(imagenRepo, reclamoRepo).run();
  
  // Seeders de contenido relacionado
  await new EncuestaSeeder(encuestaRepo, reclamoRepo, usersRepo).run();
  await new SintesisSeeder(sintesisRepo, reclamoRepo, usersRepo).run();
  await new ComentarioSeeder(comentarioRepo, reclamoRepo, usersRepo).run();
  console.log('###########################################');
  console.log('Seeders finalizados.');

  // Cerrar la conexión de Mongoose explícitamente
  const connection = app.get<Connection>(getConnectionToken());
  await connection.close();
  
  // Cerrar el contexto de la aplicación
  await app.close();
}

runSeeders()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
