import { CreateAreaDto } from "../dto/create-area.dto";
import { UpdateAreaDto } from "../dto/update-area.dto";
import { AreaDocument } from "../schemas/area.schema";

export interface IAreasResponsablesRepository {
  create(data: CreateAreaDto): Promise<AreaDocument>;
  findAll(): Promise<AreaDocument[]>;
  findOne(id: string): Promise<AreaDocument | null>;
  findDeleted(): Promise<AreaDocument[]>;
  findByName(nombre: string): Promise<AreaDocument | null>;
  update(id: string, data: UpdateAreaDto): Promise<AreaDocument | null>;
  softDelete(id: string): Promise<AreaDocument | null>;
  restore(id: string): Promise<AreaDocument | null>;
  findRawById(id: string): Promise<AreaDocument | null>;
}

export const IAREAS_RESPONSABLES_REPOSITORY = 'IAreasResponsablesRepository';