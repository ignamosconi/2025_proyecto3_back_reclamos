import { AreaDocument } from '../schemas/area.schema';
import { CreateAreaDto } from '../dto/create-area.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';

export interface IAreasResponsablesService {
  create(dto: CreateAreaDto): Promise<AreaDocument>;
  findAll(): Promise<AreaDocument[]>;
  findOne(id: string): Promise<AreaDocument>;
  findDeleted(): Promise<AreaDocument[]>;
  findByName(nombre: string): Promise<AreaDocument | null>
  update(id: string, dto: UpdateAreaDto): Promise<AreaDocument | null>;
  softDelete(id: string): Promise<AreaDocument | null>;
  restore(id: string): Promise<AreaDocument | null>;
}

export const IAREAS_RESPONSABLES_SERVICE = 'IAreasResponsablesService';