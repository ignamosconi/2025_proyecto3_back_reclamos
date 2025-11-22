import { CreateTipoReclamoDto } from '../dto/create-tipo-reclamo.dto';
import { UpdateTipoReclamoDto } from '../dto/update-tipo-reclamo.dto';
import { GetTipoReclamoQueryDto } from '../dto/get-tipo-reclamo-query.dto';
import { TipoReclamoDocument } from '../schemas/tipo-reclamo.schema';
import { PaginationResponseTipoDto } from '../dto/pag-response-tipo.dto';

export interface ITipoReclamoController {
  create(dto: CreateTipoReclamoDto): Promise<TipoReclamoDocument>;
  findAll(query: GetTipoReclamoQueryDto): Promise<PaginationResponseTipoDto>;
  findDeleted(query: GetTipoReclamoQueryDto): Promise<PaginationResponseTipoDto>;
  findOne(id: string): Promise<TipoReclamoDocument>;
  findByName(nombre: string): Promise<TipoReclamoDocument | null>;
  update(id: string, dto: UpdateTipoReclamoDto): Promise<TipoReclamoDocument | null>;
  softDelete(id: string): Promise<TipoReclamoDocument | null>;
  restore(id: string): Promise<TipoReclamoDocument | null>;
}

export const ITIPO_RECLAMO_CONTROLLER = 'ITipoReclamoController';
