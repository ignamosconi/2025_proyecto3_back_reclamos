import { Injectable, Inject } from '@nestjs/common';
import type { IReclamoEncargadoRepository } from '../reclamo/repositories/interfaces/reclamo-encargado.repository.interface';
import type { IReclamoRepository } from '../reclamo/repositories/interfaces/reclamo.repository.interface';
import type { IUsersRepository } from '../users/interfaces/users.repository.interface';
import { UserRole } from '../users/helpers/enum.roles';

@Injectable()
export class ReclamoEncargadoSeeder {
  constructor(
    @Inject('IReclamoEncargadoRepository')
    private readonly reclamoEncargadoRepo: IReclamoEncargadoRepository,
    @Inject('IReclamoRepository')
    private readonly reclamoRepo: IReclamoRepository,
    @Inject('IUsersRepository')
    private readonly userRepo: IUsersRepository,
  ) {}

  async run() {
    console.log('--- Seeding ReclamoEncargado ---');

    // Obtener reclamos
    const reclamosResponse = await this.reclamoRepo.findAllPaginated({ limit: 200, page: 1 });
    const reclamos = reclamosResponse.data;

    if (reclamos.length === 0) {
      console.log('No hay reclamos disponibles. Saltando seed de ReclamoEncargado.');
      return;
    }

    // Obtener usuarios encargados y gerentes
    const usersResponse = await this.userRepo.findAll({ limit: 100, page: 1 } as any);
    const users = usersResponse.data;
    const encargados = users.filter(
      (u: any) => u.role === UserRole.ENCARGADO || u.role === UserRole.GERENTE,
    );

    if (encargados.length === 0) {
      console.log('No hay encargados o gerentes disponibles. Saltando seed de ReclamoEncargado.');
      return;
    }

    let assigned = 0;
    let skipped = 0;

    // Asignar encargados a reclamos
    // Priorizar reclamos que están en revisión o resueltos, ya que estos deberían tener encargados
    const reclamosParaAsignar = reclamos.filter((r: any) => 
      r.estado === 'En Revisión' || r.estado === 'Resuelto' || r.estado === 'Rechazado'
    );
    
    // Si no hay suficientes reclamos en esos estados, agregar algunos pendientes también
    if (reclamosParaAsignar.length < reclamos.length * 0.5) {
      const pendientes = reclamos.filter((r: any) => r.estado === 'Pendiente');
      reclamosParaAsignar.push(...pendientes.slice(0, Math.floor(pendientes.length * 0.3)));
    }

    for (const reclamo of reclamosParaAsignar) {
      const reclamoId = String((reclamo as any)._id || reclamo.id);
      const reclamoArea = reclamo.fkArea ? String((reclamo.fkArea as any)._id || reclamo.fkArea) : null;

      if (!reclamoArea) {
        continue;
      }

      // Obtener encargados que pertenecen al área del reclamo
      const encargadosDelArea = encargados.filter((enc: any) => {
        const encAreas = enc.areas || [];
        return encAreas.some((areaId: any) => String(areaId) === reclamoArea);
      });

      if (encargadosDelArea.length === 0) {
        // Si no hay encargados del área, intentar con cualquier encargado como fallback
        // pero solo si el reclamo ya está en revisión o resuelto
        if (reclamo.estado === 'En Revisión' || reclamo.estado === 'Resuelto') {
          // Usar cualquier encargado disponible
          const encargadoFallback = encargados[Math.floor(Math.random() * encargados.length)];
          if (encargadoFallback) {
            const encargadoId = String((encargadoFallback as any)._id || (encargadoFallback as any).id);
            try {
              const yaAsignado = await this.reclamoEncargadoRepo.isEncargadoAssigned(reclamoId, encargadoId);
              if (!yaAsignado) {
                await this.reclamoEncargadoRepo.assignEncargado(reclamoId, encargadoId);
                assigned++;
              }
            } catch (error) {
              // Continuar si hay error
            }
          }
        }
        continue;
      }

      // Asignar 1-3 encargados por reclamo
      const numEncargados = Math.floor(Math.random() * 3) + 1;
      const encargadosParaAsignar = encargadosDelArea
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(numEncargados, encargadosDelArea.length));

      for (const encargado of encargadosParaAsignar) {
        const encargadoId = String((encargado as any)._id || (encargado as any).id);

        try {
          // Verificar si ya está asignado
          const yaAsignado = await this.reclamoEncargadoRepo.isEncargadoAssigned(reclamoId, encargadoId);
          if (!yaAsignado) {
            await this.reclamoEncargadoRepo.assignEncargado(reclamoId, encargadoId);
            assigned++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`Error al asignar encargado ${encargadoId} a reclamo ${reclamoId}:`, error);
        }
      }
    }

    console.log(`ReclamoEncargado procesado: ${assigned} asignaciones creadas, ${skipped} ya existentes.`);
  }
}
