import { CreateAreaDto } from "src/area/dto/create-area.dto";
import { UpdateAreaDto } from "src/area/dto/update-area.dto";
import { AreaDocument } from "src/area/schemas/area.schema";

export interface IAreaRepository {

  create(data: CreateAreaDto): Promise<AreaDocument>;
  findById(id: string): Promise<AreaDocument | null>;
  findAll(): Promise<AreaDocument[]>;
  update(id: string, data: UpdateAreaDto): Promise<AreaDocument | null>;
  softDelete(id: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  hasActiveClaims(areaId: string): Promise<boolean>;
  
}