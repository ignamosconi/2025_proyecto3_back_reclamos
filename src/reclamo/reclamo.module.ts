import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ReclamoController } from './controllers/reclamo.controller';
import { ReclamoEncargadoController } from './controllers/reclamo-encargado.controller';
import { ReclamoService } from './service/reclamo.service';
import { ReclamoRepository } from './repositories/reclamo.repository';
import { ReclamoEncargadoRepository } from './repositories/reclamo-encargado.repository';
import { ReclamoEncargadoService } from './service/reclamo-encargado.service';
import { ImagenRepository } from './repositories/imagen.repository';
import { IImagenRepository } from './repositories/interfaces/imagen.repository.interface';
import { ImagenService } from './service/imagen.service';
import { IImagenService } from './service/interfaces/imagen.service.interface';

import { Reclamo, ReclamoSchema } from './schemas/reclamo.schema';
import { ReclamoEncargado, ReclamoEncargadoSchema } from './schemas/reclamo-encargado.schema';
import { Imagen, ImagenSchema } from './schemas/imagen.schema';
import { SintesisModule } from 'src/sintesis/sintesis.module';

// Módulos relacionados (aseguran que los modelos referenciados estén registrados)
import { UsersModule } from 'src/users/users.module';
import { ProyectosModule } from 'src/proyectos/proyecto.module';
import { TipoReclamoModule } from 'src/tipoReclamo/tipo-reclamo.module';
import { AreasResponsablesModule } from 'src/areasResponsables/areas-responsables.module';
import { AuthModule } from 'src/auth/auth.module';
import { HistorialModule } from 'src/historial/historial.module';
import { MailerModule } from 'src/mailer/mailer.module';

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
		AuthModule,
		HistorialModule,
		MailerModule,
		forwardRef(() => SintesisModule),
	],
	controllers: [ReclamoController, ReclamoEncargadoController],
	providers: [
		// Servicios y repositorios
		{ provide: 'IReclamoService', useClass: ReclamoService },
		{ provide: 'IReclamoEncargadoService', useClass: ReclamoEncargadoService },
		{ provide: 'IReclamoRepository', useClass: ReclamoRepository },
		{ provide: 'IReclamoEncargadoRepository', useClass: ReclamoEncargadoRepository },
		{ provide: IImagenRepository, useClass: ImagenRepository },
		{ provide: 'IImagenService', useClass: ImagenService },
		// También registrar las clases concretas por si se inyectan directamente
		ReclamoService,
		ReclamoEncargadoService,
		ReclamoRepository,
		ReclamoEncargadoRepository,
		ImagenRepository,
		ImagenService,
	],
	exports: [
		// Exponer el servicio/repositrios para que otros módulos (ej. Historial) puedan usarlos
		'IReclamoService',
		'IReclamoRepository',
		'IReclamoEncargadoRepository',
		IImagenRepository,
		'IImagenService',
	],
})
export class ReclamoModule { }

