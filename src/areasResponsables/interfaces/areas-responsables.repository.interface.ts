import { GetAreasQueryDto } from '../dto/get-area-query.dto';
import { AreaDocument } from '../schemas/area.schema';
import { CreateAreaDto } from '../dto/create-area.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { PaginationResponseAreaDto } from '../dto/pag-response-area.dto';

export interface IAreasResponsablesRepository {
  create(data: CreateAreaDto): Promise<AreaDocument>;
  findAll(query: GetAreasQueryDto): Promise<PaginationResponseAreaDto>;
  findDeleted(query: GetAreasQueryDto): Promise<PaginationResponseAreaDto>;
  findOne(id: string): Promise<AreaDocument | null>;
  findByName(nombre: string): Promise<AreaDocument | null>;
  update(id: string, data: UpdateAreaDto): Promise<AreaDocument | null>;
  softDelete(id: string): Promise<AreaDocument | null>;
  restore(id: string): Promise<AreaDocument | null>;
  findRawById(id: string): Promise<AreaDocument | null>;
}


export const IAREAS_RESPONSABLES_REPOSITORY = 'IAreasResponsablesRepository';