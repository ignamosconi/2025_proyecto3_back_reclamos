// src/sintesis/repositories/interfaces/sintesis.repository.interface.ts

import { SintesisDocument } from '../../schemas/sintesis.schema';

export interface ISintesisRepository {
  /**
   * Crea una nueva síntesis asociada a un reclamo.
   */
  create(
    data: { nombre?: string; descripcion: string },
    reclamoId: string,
    creadorId: string,
    areaId: string,
  ): Promise<SintesisDocument>;

  /**
   * Obtiene todas las síntesis de un reclamo, ordenadas por fecha (más reciente primero).
   */
  findByReclamoId(reclamoId: string): Promise<SintesisDocument[]>;

  /**
   * Cuenta el número de síntesis asociadas a un reclamo.
   */
  countByReclamoId(reclamoId: string): Promise<number>;

  /**
   * Obtiene una síntesis por ID con sus relaciones pobladas.
   */
  findById(id: string): Promise<SintesisDocument | null>;
}

export const ISINTESIS_REPOSITORY = 'ISintesisRepository';

