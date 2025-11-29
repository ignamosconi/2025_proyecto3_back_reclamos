// src/sintesis/controllers/interfaces/sintesis.controller.interface.ts

import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { SintesisResponseDto } from '../../dto/sintesis-response.dto';

export interface ISintesisController {
  /**
   * Lista todas las síntesis de un reclamo con validación de permisos.
   */
  findAll(reclamoId: string, req: RequestWithUser): Promise<SintesisResponseDto[]>;

  /**
   * Obtiene una síntesis específica por ID con validación de permisos.
   */
  findById(reclamoId: string, sintesisId: string, req: RequestWithUser): Promise<SintesisResponseDto>;
}

