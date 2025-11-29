import { Injectable, Inject } from '@nestjs/common';
import type { IComentarioRepository } from '../comentario/repositories/interfaces/comentario.repository.interface';
import type { IReclamoRepository } from '../reclamo/repositories/interfaces/reclamo.repository.interface';
import type { IUsersRepository } from '../users/interfaces/users.repository.interface';
import { ICOMENTARIO_REPOSITORY } from '../comentario/repositories/interfaces/comentario.repository.interface';

@Injectable()
export class ComentarioSeeder {
  constructor(
    @Inject(ICOMENTARIO_REPOSITORY)
    private readonly comentarioRepo: IComentarioRepository,
    @Inject('IReclamoRepository')
    private readonly reclamoRepo: IReclamoRepository,
    @Inject('IUsersRepository')
    private readonly userRepo: IUsersRepository,
  ) {}

  async run() {
    const existing = await this.comentarioRepo.countByReclamoId('000000000000000000000000');
    if (existing > 0) {
      // Verificar si hay comentarios en algún reclamo
      const reclamosResponse = await this.reclamoRepo.findAllPaginated({ limit: 1, page: 1 });
      if (reclamosResponse.total > 0) {
        const reclamo = reclamosResponse.data[0];
        const count = await this.comentarioRepo.countByReclamoId(String(reclamo._id));
        if (count > 0) {
          console.log('Comentarios ya existen. Saltando seed.');
          return;
        }
      }
    }

    console.log('Sembrando Comentarios...');

    // Obtener datos necesarios
    const reclamosResponse = await this.reclamoRepo.findAllPaginated({ limit: 10, page: 1 });
    const reclamos = reclamosResponse.data;

    const usersResponse = await this.userRepo.findAll({} as any);
    const users = usersResponse.data;

    if (reclamos.length === 0 || users.length === 0) {
      console.log('Faltan datos previos (Reclamos o Usuarios). Saltando seed de Comentarios.');
      return;
    }

    // Obtener encargados y gerentes
    const encargados = users.filter((u: any) => u.role === 'Encargado' || u.role === 'Gerente');
    if (encargados.length === 0) {
      console.log('No hay encargados o gerentes. Saltando seed de Comentarios.');
      return;
    }

    const comentariosData = [
      {
        texto: 'Necesitamos revisar este caso con el equipo de desarrollo. El problema parece estar relacionado con la autenticación.',
        reclamo: reclamos[0],
        autor: encargados[0],
      },
      {
        texto: 'He revisado el código y encontré el problema. Está en la validación de tokens.',
        reclamo: reclamos[0],
        autor: encargados.length > 1 ? encargados[1] : encargados[0],
      },
      {
        texto: 'El reporte está vacío porque la consulta no está filtrando correctamente. Necesitamos ajustar los parámetros.',
        reclamo: reclamos.length > 1 ? reclamos[1] : reclamos[0],
        autor: encargados[0],
      },
    ];

    for (const data of comentariosData) {
      try {
        await this.comentarioRepo.create(
          data.texto,
          String((data.autor as any)._id),
          String((data.reclamo as any)._id),
        );
      } catch (error) {
        console.error(`Error al crear comentario: ${error.message}`);
      }
    }

    console.log('Comentarios sembrados.');
  }
}

