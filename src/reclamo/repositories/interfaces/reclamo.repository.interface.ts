// src/reclamos/repositories/i-reclamo-repository.interface.ts

import { CreateReclamoDto } from '../../dto/create-reclamo.dto';
import { UpdateReclamoDto } from '../../dto/update-reclamo.dto';
import { Reclamo } from '../../schemas/reclamo.schema';
import { GetReclamoQueryDto } from '../../dto/get-reclamo-query.dto';

export interface IReclamoRepository {

  findById(id: string, populate?: boolean): Promise<Reclamo | null>;
  create(reclamoData: CreateReclamoDto, fkClienteId: string, fkAreaId: string): Promise<Reclamo>;
  update(id: string, updateData: UpdateReclamoDto): Promise<Reclamo | null>;
  findAllPaginated(query: GetReclamoQueryDto, fkClienteId: string): Promise<{ data: Reclamo[], total: number, page: number, limit: number }>;
  updateArea(reclamoId: string, nuevaAreaId: string): Promise<Reclamo | null>;
  updateEstadoToEnRevision(reclamoId: string): Promise<Reclamo | null>;
  clearEncargados(reclamoId: string): Promise<void>;
  softDelete(id: string): Promise<Reclamo | null>;
  restore(id: string): Promise<Reclamo | null>;
}

// Token de inyección para NestJS
export const IReclamoRepository = Symbol('IReclamoRepository');