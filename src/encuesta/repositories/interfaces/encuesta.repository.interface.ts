import { CreateEncuestaDto } from '../../dto/create-encuesta.dto';
import { GetEncuestaQueryDto } from '../../dto/get-encuesta-query.dto';
import { EncuestaDocument } from '../../schemas/encuesta.schema';
import { PaginationResponseEncuestaDto } from '../../dto/pag-response-encuesta.dto';

export interface IEncuestaRepository {
  create(data: CreateEncuestaDto, clienteId: string, reclamoId: string): Promise<EncuestaDocument>;
  findByReclamoId(reclamoId: string): Promise<EncuestaDocument | null>;
  findByReclamoAndCliente(reclamoId: string, clienteId: string): Promise<EncuestaDocument | null>;
  findAll(query?: GetEncuestaQueryDto): Promise<PaginationResponseEncuestaDto>;
  findById(id: string): Promise<EncuestaDocument | null>;
  findRawById(id: string): Promise<EncuestaDocument | null>;
}

export const IENCUESTA_REPOSITORY = 'IEncuestaRepository';

