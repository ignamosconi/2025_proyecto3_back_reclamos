import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ReclamoController } from './controllers/reclamo.controller';
import { ReclamoService } from './service/reclamo.service';
import { ReclamoRepository } from './repositories/reclamo.repository';
import { ReclamoEncargadoRepository } from './repositories/reclamo-encargado.repository';

import { Reclamo, ReclamoSchema } from './schemas/reclamo.schema';
import { ReclamoEncargado, ReclamoEncargadoSchema } from './schemas/reclamo-encargado.schema';
import { Imagen, ImagenSchema } from './schemas/imagen.schema';

// Módulos relacionados (aseguran que los modelos referenciados estén registrados)
import { UsersModule } from 'src/users/users.module';
import { ProyectosModule } from 'src/proyectos/proyecto.module';
import { TipoReclamoModule } from 'src/tipoReclamo/tipo-reclamo.module';
import { AreasResponsablesModule } from 'src/areasResponsables/areas-responsables.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
	imports: [
		// Registro de schemas locales del módulo Reclamo
		MongooseModule.forFeature([
			{ name: Reclamo.name, schema: ReclamoSchema },
			{ name: ReclamoEncargado.name, schema: ReclamoEncargadoSchema },
			{ name: Imagen.name, schema: ImagenSchema },
		]),
		// Importar módulos que exponen los modelos referenciados por los schemas
		UsersModule,
		ProyectosModule,
		TipoReclamoModule,
		AreasResponsablesModule,
        AuthModule
	],
	controllers: [ReclamoController],
	providers: [
		// Servicios y repositorios
		{ provide: 'IReclamoService', useClass: ReclamoService },
		{ provide: 'IReclamoRepository', useClass: ReclamoRepository },
		{ provide: 'IReclamoEncargadoRepository', useClass: ReclamoEncargadoRepository },
		// También registrar las clases concretas por si se inyectan directamente
		ReclamoService,
		ReclamoRepository,
		ReclamoEncargadoRepository,
	],
	exports: [
		// Exponer el servicio/repositrios para que otros módulos (ej. Historial) puedan usarlos
		'IReclamoService',
		'IReclamoRepository',
		'IReclamoEncargadoRepository',
	],
})
export class ReclamoModule {}

