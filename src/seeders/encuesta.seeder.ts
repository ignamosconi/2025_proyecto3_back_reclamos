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
    const reclamosResponse = await this.reclamoRepo.findAllPaginated({ limit: 200, page: 1 });
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

    // Crear encuestas solo para reclamos resueltos o rechazados
    const reclamosParaEncuestar = reclamos.filter(
      (r: any) => r.estado === 'Resuelto' || r.estado === 'Rechazado',
    );

    // Limitar a 70 encuestas máximo
    const reclamosLimitados = reclamosParaEncuestar.slice(0, 70);

    // Expandir descripciones
    const descripcionesPorCalificacion = {
      5: [
        'Excelente atención y resolución rápida del problema. Muy satisfecho con el servicio.',
        'El equipo respondió de manera profesional y eficiente. Problema resuelto completamente.',
        'Atención de primera calidad. Recomendaría el servicio sin dudarlo.',
        'Muy contento con la rapidez y calidad de la solución proporcionada.',
        'Problema resuelto de manera excepcional. El equipo demostró gran profesionalismo.',
        'Servicio impecable desde el inicio hasta la resolución. Excelente trabajo.',
        'Muy satisfecho con la atención recibida. El problema se solucionó perfectamente.',
        'Gran experiencia. El equipo fue muy competente y resolutivo.',
        'Excelente servicio al cliente. Superó mis expectativas completamente.',
        'Problema resuelto de manera rápida y efectiva. Muy recomendable.',
      ],
      4: [
        'Buena atención en general, aunque hubo algunas demoras menores en la respuesta.',
        'El problema se resolvió correctamente, pero podría mejorar la comunicación.',
        'Satisfactorio, aunque esperaba una resolución un poco más rápida.',
        'Buen servicio en general, con algunas áreas de mejora menores.',
        'El problema se solucionó, aunque la comunicación podría ser más frecuente.',
        'Atención adecuada, aunque hubo algunas demoras en el proceso.',
        'Solución efectiva, pero el tiempo de respuesta podría mejorar.',
        'Buen servicio, aunque algunos aspectos podrían optimizarse.',
        'Satisfactorio en general, con algunas oportunidades de mejora.',
        'Problema resuelto correctamente, aunque el proceso fue un poco lento.',
      ],
      3: [
        'Atención regular. El problema se resolvió pero tomó más tiempo del esperado.',
        'El servicio fue aceptable, aunque hubo algunos inconvenientes durante el proceso.',
        'Resolución adecuada, pero la comunicación podría ser más clara y frecuente.',
        'Servicio promedio. Se resolvió el problema pero con algunas dificultades.',
        'Atención suficiente, aunque hubo demoras y falta de comunicación en algunos momentos.',
        'El problema se solucionó, pero el proceso no fue el más eficiente.',
        'Servicio aceptable, aunque esperaba una mejor experiencia general.',
        'Resolución correcta pero con algunas complicaciones innecesarias.',
        'Atención básica. El problema se resolvió pero sin destacar especialmente.',
        'Servicio regular. Se cumplió el objetivo pero con margen de mejora.',
      ],
      2: [
        'La atención no fue la esperada. Hubo demoras significativas en la resolución.',
        'El problema se resolvió parcialmente, pero quedaron algunos puntos pendientes.',
        'No quedé completamente satisfecho con el servicio prestado.',
        'Hubo problemas de comunicación y demoras que afectaron la experiencia.',
        'El servicio no cumplió con las expectativas básicas.',
        'Problema resuelto de manera parcial e incompleta.',
        'Atención insuficiente. El proceso fue más complicado de lo necesario.',
        'No quedé satisfecho con la calidad del servicio proporcionado.',
        'El problema se resolvió pero con muchas dificultades y demoras.',
        'Servicio por debajo de lo esperado. Mucho margen de mejora.',
      ],
      1: [
        'Muy insatisfecho con la atención recibida. El problema no se resolvió adecuadamente.',
        'Pésima experiencia. No recomendaría este servicio.',
        'La atención fue deficiente y la resolución del problema fue inadecuada.',
        'Muy descontento con el servicio. El problema no se solucionó correctamente.',
        'Experiencia negativa en general. No se cumplieron las expectativas mínimas.',
        'Servicio muy deficiente. Problema no resuelto de manera satisfactoria.',
        'Muy insatisfecho. La atención y resolución fueron inadecuadas.',
        'Pésimo servicio. No se resolvió el problema de manera efectiva.',
        'Experiencia muy negativa. No recomendaría este servicio a nadie.',
        'Muy descontento. El problema persiste y la atención fue deficiente.',
      ],
    };

    let encuestasCreadas = 0;
    let skipped = 0;

    for (let i = 0; i < reclamosLimitados.length; i++) {
      const reclamo = reclamosLimitados[i];
      const clienteId = String((reclamo as any).fkCliente?._id || (reclamo as any).fkCliente);

      // Verificar si ya existe una encuesta para este reclamo y cliente
      const encuestaExistente = await this.encuestaRepo.findByReclamoAndCliente(
        String(reclamo._id),
        clienteId,
      );

      if (encuestaExistente) {
        skipped++;
        continue;
      }

      // Distribución de calificaciones (más positivas que negativas)
      const calificaciones = [5, 5, 5, 4, 4, 4, 3, 3, 2, 1];
      const calificacion = calificaciones[i % calificaciones.length];
      const descripciones = descripcionesPorCalificacion[calificacion as keyof typeof descripcionesPorCalificacion];
      const descripcion = descripciones[Math.floor(Math.random() * descripciones.length)];

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
        if (encuestasCreadas % 10 === 0) {
          console.log(`Encuestas creadas: ${encuestasCreadas}/${reclamosLimitados.length}`);
        }
      } catch (error) {
        console.error(`Error al crear encuesta para reclamo ${reclamo._id}:`, error);
      }
    }

    console.log(`Encuestas procesadas: ${encuestasCreadas} creadas, ${skipped} ya existentes.`);
  }
}

