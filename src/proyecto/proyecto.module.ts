// src/projects/projects.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/proyecto.schema';
import { ProyectoController } from './controller/proyecto.controller';
import { ProyectoRepository } from './repositories/proyecto.repository';
import { ProyectoService } from './services/proyecto.service';

// Componentes del Módulo:


@Module({
  imports: [
    // 1. Configuración de Mongoose para el Project Schema
    // Esto hace que el modelo Project sea inyectable en el repositorio.
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [
    // 2. Registra el Controlador para manejar las rutas HTTP
    ProyectoController,
  ],
  providers: [
    // 3. Registra el Repositorio (la capa de persistencia)
    ProyectoRepository, 
    // 4. Registra el Servicio (la capa de lógica de negocio)
    ProyectoService,
  ],
  exports: [
    // Exportamos el servicio y el repositorio por si son necesarios
    // para la inyección de dependencia en otros módulos (ej: Módulo de Reclamos).
    ProyectoService,
    ProyectoRepository,
  ],
})
export class ProyectoModule {}