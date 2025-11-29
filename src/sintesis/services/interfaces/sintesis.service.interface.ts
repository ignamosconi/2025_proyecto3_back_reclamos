// src/sintesis/services/interfaces/sintesis.service.interface.ts

import { SintesisDocument } from '../../schemas/sintesis.schema';
import { CreateSintesisDto } from '../../dto/create-sintesis.dto';

export interface ISintesisService {
  /**
   * Crea una nueva síntesis asociada a un reclamo.
   * La validación del reclamo debe hacerse antes de llamar a este método.
   */
  create(
    data: CreateSintesisDto,
    reclamoId: string,
    creadorId: string,
    areaId: string,
  ): Promise<SintesisDocument>;

  /**
   * Obtiene todas las síntesis de un reclamo con validación de permisos.
   * Los clientes solo pueden ver síntesis de sus propios reclamos.
   * Los encargados solo pueden ver síntesis de reclamos de sus áreas asignadas.
   * Los gerentes pueden ver todas las síntesis.
   */
  findByReclamoId(reclamoId: string, userRole: string, userId: string): Promise<SintesisDocument[]>;

  /**
   * Obtiene una síntesis específica por ID con validación de permisos.
   * Valida que la síntesis pertenezca al reclamo especificado.
   * Los clientes solo pueden ver síntesis de sus propios reclamos.
   * Los encargados solo pueden ver síntesis de reclamos de sus áreas asignadas.
   * Los gerentes pueden ver todas las síntesis.
   */
  findById(id: string, reclamoId: string, userRole: string, userId: string): Promise<SintesisDocument | null>;
}

export const ISINTESIS_SERVICE = 'ISintesisService';

