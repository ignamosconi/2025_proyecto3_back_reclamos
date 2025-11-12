import { CreateProyectoDto } from "src/proyecto/dto/create-proyecto.dto";
import { FilterProyectoDto } from "src/proyecto/dto/filter-proyecto.dto";
import { UpdateProyectoDto } from "src/proyecto/dto/update-proyecto.dto";
import { ProjectDocument } from "src/proyecto/schemas/proyecto.schema";

export interface IProyectoController {
  
  // POST /projects
  create(createProyectoDto: CreateProyectoDto): Promise<ProjectDocument>;

  // GET /projects
  findAll(filters: FilterProyectoDto): Promise<ProjectDocument[]>;
  
  // GET /projects/:id
  findOne(id: string): Promise<ProjectDocument>; 

  // PUT /projects/:id
  update(id: string, updateProyectoDto: UpdateProyectoDto): Promise<ProjectDocument>;

  // DELETE /projects/:id (Soft Delete)
  delete(id: string): Promise<void>;
  
  // PUT /projects/restore/:id
  restore(id: string): Promise<boolean>;
}