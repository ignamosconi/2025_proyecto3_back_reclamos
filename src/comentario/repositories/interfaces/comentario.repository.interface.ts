import { Comentario } from '../../schemas/comentario.schema';

export interface IComentarioRepository {
  /**
   * Crea un nuevo comentario asociado a un reclamo.
   */
  create(
    texto: string,
    autorId: string,
    reclamoId: string,
  ): Promise<Comentario>;

  /**
   * Obtiene todos los comentarios de un reclamo específico, ordenados por fecha (más recientes primero).
   */
  findByReclamoId(reclamoId: string): Promise<Comentario[]>;

  /**
   * Cuenta cuántos comentarios tiene un reclamo.
   */
  countByReclamoId(reclamoId: string): Promise<number>;
}

export const ICOMENTARIO_REPOSITORY = Symbol('IComentarioRepository');

