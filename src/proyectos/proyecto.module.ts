import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Proyecto, ProyectoSchema } from './schemas/proyecto.schema';
import { UsersModule } from 'src/users/users.module';
import { AreasResponsablesModule } from 'src/areasResponsables/areas-responsables.module';
import { ProyectosController } from './controllers/proyecto.controller';
import { ProyectosRepository } from './repositories/proyecto.repository';
import { ProyectosService } from './services/proyecto.service';

@Module({
  imports: [
    // 1. Registro del Schema de Proyecto en Mongoose
    MongooseModule.forFeature([
      { name: Proyecto.name, schema: ProyectoSchema },
    ]),
    // Importar UsersModule para asegurar que el modelo 'User' esté registrado
    UsersModule,
    // Importar AreasResponsablesModule para asegurar que el modelo 'Area' esté registrado
    AreasResponsablesModule,
    // Si Proyecto tuviera referencias a otros módulos (como UsersModule, AreasModule)
    // esos módulos deberían importarse aquí si se necesitan sus servicios.
  ],
  controllers: [ProyectosController], // 2. Registro del Controlador
  providers: [
    // 3. Registro del Repositorio (Binding de Interfaz a Clase)
    {
      provide: 'IProyectosRepository', // Token de inyección usado con @Inject()
      useClass: ProyectosRepository,
    },
    // 4. Registro del Servicio (Binding de Interfaz a Clase)
    {
      provide: 'IProyectosService', // Token de inyección usado con @Inject()
      useClass: ProyectosService,
    },
    // El Repositorio concreto debe listarse para que Nest lo pueda resolver (opcional, pero buena práctica si tiene dependencias)
    ProyectosRepository, 
    ProyectosService, 
  ],
  // Exportar el servicio si otros módulos necesitan consultarlo (ej: ReclamosModule)
  exports: ['IProyectosService', 'IProyectosRepository'],
})
export class ProyectosModule {}