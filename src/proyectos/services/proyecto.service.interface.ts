import { ProyectoDocument } from '../schemas/proyecto.schema';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { GetProyectosQueryDto } from '../dto/get-proyecto-query.dto';
import { PaginationResponseProyectoDto } from '../dto/pag-proyecto.dto';

export interface IProyectosService {
  create(data: CreateProyectoDto): Promise<ProyectoDocument>;
  findAll(query: GetProyectosQueryDto, userId?: string, userRole?: string): Promise<PaginationResponseProyectoDto>;
  findById(id: string, userId?: string, userRole?: string): Promise<ProyectoDocument>;
  update(id: string, data: UpdateProyectoDto): Promise<ProyectoDocument>;
  delete(id: string): Promise<void>;
  findDeleted(query: GetProyectosQueryDto): Promise<PaginationResponseProyectoDto>;
  restore(id: string): Promise<ProyectoDocument>;
}