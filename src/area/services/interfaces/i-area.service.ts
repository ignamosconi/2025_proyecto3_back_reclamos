import { CreateAreaDto } from "src/area/dto/create-area.dto";
import { UpdateAreaDto } from "src/area/dto/update-area.dto";
import { AreaDocument } from "src/area/schemas/area.schema";

export interface IAreaService {

  createArea(data: CreateAreaDto): Promise<AreaDocument>;
  getAreaById(id: string): Promise<AreaDocument>;
  getAreas(): Promise<AreaDocument[]>;
  updateArea(id: string, data: UpdateAreaDto): Promise<AreaDocument>;
  deleteArea(id: string): Promise<boolean>;
  
}