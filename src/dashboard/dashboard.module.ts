// src/dashboard/dashboard.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reclamo, ReclamoSchema } from 'src/reclamo/schemas/reclamo.schema';
import {
  ReclamoEncargado,
  ReclamoEncargadoSchema,
} from 'src/reclamo/schemas/reclamo-encargado.schema';
import {
  Historial,
  HistorialSchema,
} from 'src/historial/schemas/historial.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { DashboardClienteController } from './controllers/dashboard-cliente.controller';
import { DashboardEncargadoController } from './controllers/dashboard-encargado.controller';
import { DashboardGerenteController } from './controllers/dashboard-gerente.controller';
import { DashboardClienteService } from './services/dashboard-cliente.service';
import { DashboardEncargadoService } from './services/dashboard-encargado.service';
import { DashboardGerenteService } from './services/dashboard-gerente.service';
import { ExportService } from './services/export.service';
import {
  IDASHBOARD_CLIENTE_SERVICE,
  IDashboardClienteService,
} from './services/interfaces/dashboard-cliente.service.interface';
import {
  IDASHBOARD_ENCARGADO_SERVICE,
  IDashboardEncargadoService,
} from './services/interfaces/dashboard-encargado.service.interface';
import {
  IDASHBOARD_GERENTE_SERVICE,
  IDashboardGerenteService,
} from './services/interfaces/dashboard-gerente.service.interface';
import {
  IEXPORT_SERVICE,
  IExportService,
} from './services/interfaces/export.service.interface';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reclamo.name, schema: ReclamoSchema },
      { name: ReclamoEncargado.name, schema: ReclamoEncargadoSchema },
      { name: Historial.name, schema: HistorialSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [
    DashboardClienteController,
    DashboardEncargadoController,
    DashboardGerenteController,
  ],
  providers: [
    {
      provide: IDASHBOARD_CLIENTE_SERVICE,
      useClass: DashboardClienteService,
    },
    {
      provide: IDASHBOARD_ENCARGADO_SERVICE,
      useClass: DashboardEncargadoService,
    },
    {
      provide: IDASHBOARD_GERENTE_SERVICE,
      useClass: DashboardGerenteService,
    },
    {
      provide: IEXPORT_SERVICE,
      useClass: ExportService,
    },
    DashboardClienteService,
    DashboardEncargadoService,
    DashboardGerenteService,
    ExportService,
  ],
  exports: [
    IDASHBOARD_CLIENTE_SERVICE,
    IDASHBOARD_ENCARGADO_SERVICE,
    IDASHBOARD_GERENTE_SERVICE,
    IEXPORT_SERVICE,
  ],
})
export class DashboardModule {}
