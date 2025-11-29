import { Injectable, Inject } from '@nestjs/common';
import type { ISintesisRepository } from '../sintesis/repositories/interfaces/sintesis.repository.interface';
import { ISINTESIS_REPOSITORY } from '../sintesis/repositories/interfaces/sintesis.repository.interface';
import type { IReclamoRepository } from '../reclamo/repositories/interfaces/reclamo.repository.interface';
import type { IUsersRepository } from '../users/interfaces/users.repository.interface';
import { IUSERS_REPOSITORY } from '../users/interfaces/users.repository.interface';
import { EstadoReclamo } from '../reclamo/enums/estado.enum';

@Injectable()
export class SintesisSeeder {
  constructor(
    @Inject('ISintesisRepository') private readonly sintesisRepo: ISintesisRepository,
    @Inject('IReclamoRepository') private readonly reclamoRepo: IReclamoRepository,
    @Inject(IUSERS_REPOSITORY) private readonly userRepo: IUsersRepository,
  ) {}

  async run() {
    const existing = await this.sintesisRepo.countByReclamoId('000000000000000000000000');
    if (existing > 0) {
      // Check if there are any síntesis at all by checking a few reclamos
      const reclamosResponse = await this.reclamoRepo.findAllPaginated({ limit: 5, page: 1 });
      const reclamos = reclamosResponse.data;
      let hasAnySintesis = false;
      for (const reclamo of reclamos) {
        const count = await this.sintesisRepo.countByReclamoId(String(reclamo._id));
        if (count > 0) {
          hasAnySintesis = true;
          break;
        }
      }
      if (hasAnySintesis) {
        console.log('Síntesis ya existen. Saltando seed.');
        return;
      }
    }

    console.log('Sembrando Síntesis...');

    // Obtener reclamos existentes que estén en EN_REVISION, RESUELTO o RECHAZADO
    const reclamosResponse = await this.reclamoRepo.findAllPaginated(
      { limit: 20, page: 1 },
      undefined,
      undefined,
    );
    const todosLosReclamos = reclamosResponse.data;

    // Filtrar reclamos que tengan un estado que permita síntesis
    const reclamosElegibles = todosLosReclamos.filter(
      (r: any) =>
        r.estado === EstadoReclamo.EN_REVISION ||
        r.estado === EstadoReclamo.RESUELTO ||
        r.estado === EstadoReclamo.RECHAZADO,
    );

    if (reclamosElegibles.length === 0) {
      console.log('No hay reclamos elegibles para sembrar síntesis. Saltando seed de Síntesis.');
      return;
    }

    // Obtener usuarios encargados
    const usersResponse = await this.userRepo.findAll({} as any);
    const users = usersResponse.data;
    const encargados = users.filter((u: any) => u.role === 'ENCARGADO' || u.role === 'Encargado');

    if (encargados.length === 0) {
      console.log('No hay encargados para sembrar síntesis. Saltando seed de Síntesis.');
      return;
    }

    // Síntesis de ejemplo para diferentes situaciones
    const sintesisEjemplos = [
      {
        nombre: 'Revisión inicial',
        descripcion:
          'Se ha iniciado la revisión del reclamo. El equipo técnico está analizando el problema reportado y evaluando las posibles soluciones.',
      },
      {
        nombre: 'Análisis del problema',
        descripcion:
          'Se ha identificado la causa raíz del problema. Estamos trabajando en implementar una solución que resuelva definitivamente la situación reportada.',
      },
      {
        nombre: 'Implementación de solución',
        descripcion:
          'Se ha implementado una solución temporal para mitigar el impacto del problema. Estamos trabajando en una solución permanente que estará disponible próximamente.',
      },
      {
        nombre: 'Resolución completada',
        descripcion:
          'El problema ha sido resuelto completamente. Se han realizado todas las verificaciones necesarias y se confirma que la solución es estable y funcional.',
      },
      {
        nombre: 'Reclamo rechazado',
        descripcion:
          'Luego de una revisión exhaustiva, se ha determinado que el reclamo no puede ser procesado debido a que no cumple con los criterios establecidos o está fuera del alcance del servicio.',
      },
      {
        nombre: 'Actualización de progreso',
        descripcion:
          'Hemos avanzado significativamente en la resolución del problema. Actualmente estamos en la fase de pruebas y validación de la solución propuesta.',
      },
      {
        nombre: null,
        descripcion:
          'El reclamo está siendo procesado por nuestro equipo. Mantendremos informado al cliente sobre cualquier novedad.',
      },
    ];

    // Crear síntesis para algunos reclamos elegibles
    let sintesisCreadas = 0;
    const reclamosParaSintesis = reclamosElegibles.slice(0, Math.min(10, reclamosElegibles.length));

    for (let i = 0; i < reclamosParaSintesis.length; i++) {
      const reclamo = reclamosParaSintesis[i];
      const reclamoId = String(reclamo._id);

      // Verificar si ya existe una síntesis para este reclamo
      const existingCount = await this.sintesisRepo.countByReclamoId(reclamoId);
      if (existingCount > 0) {
        console.log(`Síntesis ya existen para reclamo ${reclamoId}. Saltando.`);
        continue;
      }

      // Seleccionar un encargado aleatorio
      const encargado = encargados[i % encargados.length];
      const encargadoId = (encargado as any)._id 
        ? String((encargado as any)._id)
        : String(encargado);

      // Obtener el área del reclamo
      const reclamoAreaId =
        reclamo.fkArea && (reclamo.fkArea as any)._id
          ? String((reclamo.fkArea as any)._id)
          : String(reclamo.fkArea);

      if (!reclamoAreaId || reclamoAreaId === 'undefined' || reclamoAreaId === 'null') {
        console.log(`Reclamo ${reclamoId} no tiene área asignada. Saltando.`);
        continue;
      }

      // Seleccionar síntesis según el estado del reclamo
      let sintesisElegida;
      if (reclamo.estado === EstadoReclamo.RESUELTO) {
        sintesisElegida = sintesisEjemplos[3]; // Resolución completada
      } else if (reclamo.estado === EstadoReclamo.RECHAZADO) {
        sintesisElegida = sintesisEjemplos[4]; // Reclamo rechazado
      } else {
        // EN_REVISION
        sintesisElegida = sintesisEjemplos[i % sintesisEjemplos.length];
      }

      try {
        await this.sintesisRepo.create(
          {
            nombre: sintesisElegida.nombre,
            descripcion: sintesisElegida.descripcion,
          },
          reclamoId,
          encargadoId,
          reclamoAreaId,
        );
        sintesisCreadas++;
        console.log(`Síntesis creada para reclamo ${reclamoId} por encargado ${encargadoId}`);
      } catch (error) {
        console.error(`Error al crear síntesis para reclamo ${reclamoId}:`, error);
      }
    }

    console.log(`Síntesis sembradas: ${sintesisCreadas}`);
  }
}

