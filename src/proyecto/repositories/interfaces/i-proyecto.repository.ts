import { CreateProyectoDto } from "src/proyecto/dto/create-proyecto.dto";
import { FilterProyectoDto } from "src/proyecto/dto/filter-proyecto.dto";
import { UpdateProyectoDto } from "src/proyecto/dto/update-proyecto.dto";
import { ProjectDocument } from "src/proyecto/schemas/proyecto.schema";


export interface IProyectoRepository {
  // CRUD Básico
  create(data: CreateProyectoDto): Promise<ProjectDocument>;
  findById(id: string): Promise<ProjectDocument | null>;
  update(id: string, data: UpdateProyectoDto): Promise<ProjectDocument | null>;
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;

  // Operaciones Específicas
  findAll(filters: FilterProyectoDto): Promise<ProjectDocument[]>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
}