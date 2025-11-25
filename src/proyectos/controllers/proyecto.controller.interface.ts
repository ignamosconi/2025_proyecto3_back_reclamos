import { CreateProyectoDto } from "../dto/create-proyecto.dto";
import { PaginationResponseProyectoDto } from "../dto/pag-proyecto.dto";
import { GetProyectosQueryDto } from "../dto/get-proyecto-query.dto";
import { UpdateProyectoDto } from "../dto/update-proyecto.dto";
import { ProyectoDocument } from "../schemas/proyecto.schema";


export interface IProyectosController {
  create(createDto: CreateProyectoDto): Promise<ProyectoDocument>;
  
  findAll(query: GetProyectosQueryDto): Promise<PaginationResponseProyectoDto>;

  findOne(id: string): Promise<ProyectoDocument>;

  update(id: string, updateDto: UpdateProyectoDto): Promise<ProyectoDocument>;

  delete(id: string): Promise<void>;
}