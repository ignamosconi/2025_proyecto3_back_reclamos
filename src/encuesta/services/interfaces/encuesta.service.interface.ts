import { CreateEncuestaDto } from '../../dto/create-encuesta.dto';
import { GetEncuestaQueryDto } from '../../dto/get-encuesta-query.dto';
import { EncuestaDocument } from '../../schemas/encuesta.schema';
import { PaginationResponseEncuestaDto } from '../../dto/pag-response-encuesta.dto';

export interface IEncuestaService {
  create(data: CreateEncuestaDto, clienteId: string, reclamoId: string): Promise<EncuestaDocument>;
  findByReclamoId(reclamoId: string, userRole: string, userId: string): Promise<EncuestaDocument | null>;
  findAll(query?: GetEncuestaQueryDto, userRole?: string): Promise<PaginationResponseEncuestaDto>;
}

export const IENCUESTA_SERVICE = 'IEncuestaService';

