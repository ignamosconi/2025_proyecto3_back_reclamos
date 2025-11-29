import { Comentario } from '../../schemas/comentario.schema';
import { CreateComentarioDto } from '../../dto/create-comentario.dto';

export interface IComentarioService {
  /**
   * Crea un nuevo comentario interno en un reclamo.
   * Solo Gerentes y encargados asignados al reclamo pueden crear comentarios.
   */
  create(
    reclamoId: string,
    data: CreateComentarioDto,
    autorId: string,
    autorRole: string,
  ): Promise<Comentario>;

  /**
   * Obtiene todos los comentarios de un reclamo específico.
   * Solo Gerentes y encargados asignados al reclamo pueden ver los comentarios.
   */
  findByReclamoId(
    reclamoId: string,
    userId: string,
    userRole: string,
  ): Promise<Comentario[]>;
}

export const ICOMENTARIO_SERVICE = Symbol('IComentarioService');

