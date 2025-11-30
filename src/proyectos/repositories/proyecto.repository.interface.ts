import { ProyectoDocument } from '../schemas/proyecto.schema';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { PaginationResponseProyectoDto } from '../dto/pag-proyecto.dto';
import { GetProyectosQueryDto } from '../dto/get-proyecto-query.dto';

export interface IProyectosRepository {
  create(data: CreateProyectoDto): Promise<ProyectoDocument>;
  findById(id: string): Promise<ProyectoDocument | null>;
  findAll(query?: GetProyectosQueryDto, clienteFilter?: string, areasFilter?: string[]): Promise<PaginationResponseProyectoDto>;
  findByName(nombre: string): Promise<ProyectoDocument | null>;
  update(id: string, data: UpdateProyectoDto): Promise<ProyectoDocument | null>;
  softDelete(id: string): Promise<ProyectoDocument | null>;
  findDeleted(query: GetProyectosQueryDto): Promise<PaginationResponseProyectoDto>;
  restore(id: string): Promise<ProyectoDocument | null>;
  findRawById(id: string): Promise<ProyectoDocument | null>;
}