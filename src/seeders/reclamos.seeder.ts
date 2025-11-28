import { Injectable, Inject } from '@nestjs/common';
import type { IReclamoRepository } from '../reclamo/repositories/interfaces/reclamo.repository.interface';
import type { IProyectosRepository } from '../proyectos/repositories/proyecto.repository.interface';
import type { IUsersRepository } from '../users/interfaces/users.repository.interface';
import type { ITipoReclamoRepository } from '../tipoReclamo/interfaces/tipo-reclamo.repository.interface';
import { Prioridad } from '../reclamo/enums/prioridad.enum';
import { Criticidad } from '../reclamo/enums/criticidad.enum';

@Injectable()
export class ReclamosSeeder {
     constructor(
          @Inject('IReclamoRepository') private readonly reclamoRepo: IReclamoRepository,
          @Inject('IProyectosRepository') private readonly proyectoRepo: IProyectosRepository,
          @Inject('IUsersRepository') private readonly userRepo: IUsersRepository,
          @Inject('ITipoReclamoRepository') private readonly tipoReclamoRepo: ITipoReclamoRepository,
     ) { }

     async run() {
          const existing = await this.reclamoRepo.findAllPaginated({ limit: 1, page: 1 });
          if (existing.total > 0) {
               console.log('Reclamos ya existen. Saltando seed.');
               return;
          }

          console.log('Sembrando Reclamos...');

          // Obtener datos necesarios
          const proyectosResponse = await this.proyectoRepo.findAll({} as any);
          const proyectos = proyectosResponse.data;

          // Users y Tipos también devuelven paginación, necesitamos pasar query vacía o default
          const usersResponse = await this.userRepo.findAll({} as any);
          const users = usersResponse.data;

          const tiposResponse = await this.tipoReclamoRepo.findAll({} as any);
          const tipos = tiposResponse.data;

          if (proyectos.length === 0 || users.length === 0 || tipos.length === 0) {
               console.log('Faltan datos previos (Proyectos, Usuarios o Tipos). Saltando seed de Reclamos.');
               return;
          }

          const cliente = users.find(u => (u as any).role === 'Cliente') || users[0];
          const proyecto = proyectos[0];
          const tipo = tipos[0];

          // Obtener area del proyecto
          let areaId: string;
          if (proyecto.areaResponsable && (proyecto.areaResponsable as any)._id) {
               areaId = String((proyecto.areaResponsable as any)._id);
          } else {
               areaId = String(proyecto.areaResponsable);
          }

          const reclamosData = [
               {
                    titulo: 'Fallo en Login',
                    descripcion: 'No puedo ingresar con mis credenciales.',
                    prioridad: Prioridad.ALTA,
                    criticidad: Criticidad.SI,
                    fkCliente: String((cliente as any)._id),
                    fkProyecto: String((proyecto as any)._id),
                    fkTipoReclamo: String((tipo as any)._id),
                    fkArea: areaId,
               },
               {
                    titulo: 'Error en Reporte',
                    descripcion: 'El reporte sale vacío.',
                    prioridad: Prioridad.MEDIA,
                    criticidad: Criticidad.NO,
                    fkCliente: String((cliente as any)._id),
                    fkProyecto: String((proyecto as any)._id),
                    fkTipoReclamo: String((tipo as any)._id),
                    fkArea: areaId,
               },
          ];

          for (const data of reclamosData) {
               await this.reclamoRepo.create(data as any, data.fkCliente, data.fkArea);
          }

          console.log('Reclamos sembrados.');
     }
}
