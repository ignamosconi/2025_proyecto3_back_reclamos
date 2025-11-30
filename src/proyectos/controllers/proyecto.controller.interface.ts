import { CreateProyectoDto } from "../dto/create-proyecto.dto";
import { PaginationResponseProyectoDto } from "../dto/pag-proyecto.dto";
import { GetProyectosQueryDto } from "../dto/get-proyecto-query.dto";
import { UpdateProyectoDto } from "../dto/update-proyecto.dto";
import { ProyectoDocument } from "../schemas/proyecto.schema";
import type { RequestWithUser } from "../../auth/interfaces/request-with-user.interface";


export interface IProyectosController {
  create(createDto: CreateProyectoDto): Promise<ProyectoDocument>;
  
  findAll(query: GetProyectosQueryDto, req: RequestWithUser): Promise<PaginationResponseProyectoDto>;

  findOne(id: string, req: RequestWithUser): Promise<ProyectoDocument>;

  update(id: string, updateDto: UpdateProyectoDto): Promise<ProyectoDocument>;

  delete(id: string): Promise<void>;

  findDeleted(query: GetProyectosQueryDto): Promise<PaginationResponseProyectoDto>;
  restore(id: string): Promise<ProyectoDocument>;
}