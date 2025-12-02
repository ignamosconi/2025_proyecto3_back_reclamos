import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IAREAS_RESPONSABLES_REPOSITORY } from './interfaces/areas-responsables.repository.interface';
import type { IAreasResponsablesRepository } from './interfaces/areas-responsables.repository.interface';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { GetAreasQueryDto } from './dto/get-area-query.dto';
import { AreaDocument } from './schemas/area.schema';
import { PaginationResponseAreaDto } from './dto/pag-response-area.dto';
import { Reclamo } from 'src/reclamo/schemas/reclamo.schema';
import { EstadoReclamo } from 'src/reclamo/enums/estado.enum';

@Injectable()
export class AreasResponsablesService {
  constructor(
    @Inject(IAREAS_RESPONSABLES_REPOSITORY)
    private readonly repository: IAreasResponsablesRepository,
    @InjectModel(Reclamo.name)
    private readonly reclamoModel: Model<Reclamo>,
  ) {}

  async create(dto: CreateAreaDto) {
    const existing = await this.findByName(dto.nombre);
    if (existing) throw new ConflictException(`El área "${dto.nombre}" ya existe.`);
    return this.repository.create(dto);
  }

  async findAll(query: GetAreasQueryDto): Promise<PaginationResponseAreaDto> {
    return this.repository.findAll(query);
  }

  async findDeleted(query: GetAreasQueryDto): Promise<PaginationResponseAreaDto> {
    return this.repository.findDeleted(query);
  }

  async findOne(id: string): Promise<AreaDocument | null> {
    return this.repository.findOne(id);
  }

  async update(id: string, data: UpdateAreaDto): Promise<AreaDocument | null> {
    const area = await this.repository.findRawById(id);
    if (!area) throw new BadRequestException(`Área con id ${id} no encontrada.`);
    if (area.deletedAt) throw new BadRequestException(`No se puede actualizar un área soft-deleted.`);
    
    // Validar que el nombre sea único si se está cambiando
    if (data.nombre && data.nombre !== area.nombre) {
      const existing = await this.findByName(data.nombre);
      if (existing) {
        const existingDoc = existing as AreaDocument;
        if (existingDoc._id && existingDoc._id.toString() !== id) {
          throw new ConflictException(`El área "${data.nombre}" ya existe.`);
        }
      }
    }
    
    return this.repository.update(id, data);
  }

  async softDelete(id: string): Promise<AreaDocument | null> {
    // Verificar que no existan reclamos activos asociados a este área
    // Un reclamo está activo si NO está en estado RESUELTO o RECHAZADO
    const reclamosActivos = await this.reclamoModel.find({
      fkArea: id,
      deletedAt: null,
      estado: { $nin: [EstadoReclamo.RESUELTO, EstadoReclamo.RECHAZADO] },
    }).select('_id titulo estado').exec();

    if (reclamosActivos.length > 0) {
      const reclamosLista = reclamosActivos.map((r: any) => ({
        id: r._id.toString(),
        titulo: r.titulo,
        estado: r.estado,
      }));
      
      throw new BadRequestException({
        message: `No se puede eliminar el área porque tiene ${reclamosActivos.length} reclamo(s) activo(s) asociado(s).`,
        reclamosActivos: reclamosLista,
      });
    }

    return this.repository.softDelete(id);
  }

  async restore(id: string): Promise<AreaDocument | null> {
    return this.repository.restore(id);
  }

  async findByName(nombre: string): Promise<AreaDocument | null> {
    return this.repository.findByName(nombre);
  }
}
