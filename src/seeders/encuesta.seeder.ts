import { Injectable, Inject } from '@nestjs/common';
import type { IEncuestaRepository } from '../encuesta/repositories/interfaces/encuesta.repository.interface';
import { IENCUESTA_REPOSITORY } from '../encuesta/repositories/interfaces/encuesta.repository.interface';
import type { IReclamoRepository } from '../reclamo/repositories/interfaces/reclamo.repository.interface';
import type { IUsersRepository } from '../users/interfaces/users.repository.interface';
import { IUSERS_REPOSITORY } from '../users/interfaces/users.repository.interface';

@Injectable()
export class EncuestaSeeder {
  constructor(
    @Inject(IENCUESTA_REPOSITORY) private readonly encuestaRepo: IEncuestaRepository,
    @Inject('IReclamoRepository') private readonly reclamoRepo: IReclamoRepository,
    @Inject(IUSERS_REPOSITORY) private readonly userRepo: IUsersRepository,
  ) {}

  async run() {
    const existing = await this.encuestaRepo.findAll({ limit: 1, page: 1 });
    if (existing.total > 0) {
      console.log('Encuestas ya existen. Saltando seed.');
      return;
    }

    console.log('Sembrando Encuestas...');

    // Obtener reclamos existentes
    const reclamosResponse = await this.reclamoRepo.findAllPaginated({ limit: 10, page: 1 });
    const reclamos = reclamosResponse.data;

    if (reclamos.length === 0) {
      console.log('No hay reclamos para sembrar encuestas. Saltando seed de Encuestas.');
      return;
    }

    // Obtener usuarios clientes
    const usersResponse = await this.userRepo.findAll({} as any);
    const users = usersResponse.data;
    const clientes = users.filter((u: any) => u.role === 'Cliente');

    if (clientes.length === 0) {
      console.log('No hay clientes para sembrar encuestas. Saltando seed de Encuestas.');
      return;
    }

    // Descripciones de ejemplo para diferentes calificaciones
    const descripcionesPorCalificacion = {
      5: [
        'Excelente atención y resolución rápida del problema. Muy satisfecho con el servicio.',
        'El equipo respondió de manera profesional y eficiente. Problema resuelto completamente.',
        'Atención de primera calidad. Recomendaría el servicio sin dudarlo.',
      ],
      4: [
        'Buena atención en general, aunque hubo algunas demoras menores en la respuesta.',
        'El problema se resolvió correctamente, pero podría mejorar la comunicación.',
        'Satisfactorio, aunque esperaba una resolución un poco más rápida.',
      ],
      3: [
        'Atención regular. El problema se resolvió pero tomó más tiempo del esperado.',
        'El servicio fue aceptable, aunque hubo algunos inconvenientes durante el proceso.',
        'Resolución adecuada, pero la comunicación podría ser más clara y frecuente.',
      ],
      2: [
        'La atención no fue la esperada. Hubo demoras significativas en la resolución.',
        'El problema se resolvió parcialmente, pero quedaron algunos puntos pendientes.',
        'No quedé completamente satisfecho con el servicio prestado.',
      ],
      1: [
        'Muy insatisfecho con la atención recibida. El problema no se resolvió adecuadamente.',
        'Pésima experiencia. No recomendaría este servicio.',
        'La atención fue deficiente y la resolución del problema fue inadecuada.',
      ],
    };

    // Crear encuestas para algunos reclamos
    let encuestasCreadas = 0;
    const reclamosParaEncuestar = reclamos.slice(0, Math.min(5, reclamos.length));

    for (let i = 0; i < reclamosParaEncuestar.length; i++) {
      const reclamo = reclamosParaEncuestar[i];
      const clienteId = String((reclamo as any).fkCliente?._id || (reclamo as any).fkCliente);

      // Verificar si ya existe una encuesta para este reclamo y cliente
      const encuestaExistente = await this.encuestaRepo.findByReclamoAndCliente(
        String(reclamo._id),
        clienteId,
      );

      if (encuestaExistente) {
        console.log(`Encuesta ya existe para reclamo ${reclamo._id}. Saltando.`);
        continue;
      }

      // Asignar calificación variada (mayormente positivas)
      const calificaciones = [5, 5, 4, 4, 3];
      const calificacion = calificaciones[i % calificaciones.length];
      const descripciones = descripcionesPorCalificacion[calificacion as keyof typeof descripcionesPorCalificacion];
      const descripcion = descripciones[i % descripciones.length];

      try {
        await this.encuestaRepo.create(
          {
            calificacion,
            descripcion,
          },
          clienteId,
          String(reclamo._id),
        );
        encuestasCreadas++;
        console.log(`Encuesta creada para reclamo ${reclamo._id} con calificación ${calificacion}`);
      } catch (error) {
        console.error(`Error al crear encuesta para reclamo ${reclamo._id}:`, error);
      }
    }

    console.log(`Encuestas sembradas: ${encuestasCreadas}`);
  }
}

