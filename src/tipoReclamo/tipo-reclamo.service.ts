import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ITipoReclamoRepository } from './interfaces/tipo-reclamo.repository.interface';
import { ITIPO_RECLAMO_REPOSITORY } from './interfaces/tipo-reclamo.repository.interface';
import { CreateTipoReclamoDto } from './dto/create-tipo-reclamo.dto';
import { UpdateTipoReclamoDto } from './dto/update-tipo-reclamo.dto';
import { GetTipoReclamoQueryDto } from './dto/get-tipo-reclamo-query.dto';
import { TipoReclamoDocument } from './schemas/tipo-reclamo.schema';
import { PaginationResponseTipoDto } from './dto/pag-response-tipo.dto';
import { Reclamo } from 'src/reclamo/schemas/reclamo.schema';
import { EstadoReclamo } from 'src/reclamo/enums/estado.enum';

@Injectable()
export class TipoReclamoService {
  constructor(
    @Inject(ITIPO_RECLAMO_REPOSITORY)
    private readonly repository: ITipoReclamoRepository,
    @InjectModel(Reclamo.name)
    private readonly reclamoModel: Model<Reclamo>,
  ) {}

  async create(dto: CreateTipoReclamoDto) {
    const existing = await this.findByName(dto.nombre);
    if (existing) throw new ConflictException(`El tipo de reclamo "${dto.nombre}" ya existe.`);
    return this.repository.create(dto);
  }

  async findAll(query: GetTipoReclamoQueryDto): Promise<PaginationResponseTipoDto> {
    return this.repository.findAll(query);
  }

  async findDeleted(query: GetTipoReclamoQueryDto): Promise<PaginationResponseTipoDto> {
    return this.repository.findDeleted(query);
  }

  async findOne(id: string): Promise<TipoReclamoDocument | null> {
    return this.repository.findOne(id);
  }

  async update(id: string, dto: UpdateTipoReclamoDto): Promise<TipoReclamoDocument | null> {
    const doc = await this.repository.findRawById(id);
    if (!doc) throw new BadRequestException(`Tipo de reclamo con id ${id} no encontrado`);
    if (doc.deletedAt) throw new BadRequestException(`No se puede actualizar un tipo de reclamo soft-deleted`);
    
    // Validar que el nombre sea único si se está cambiando
    if (dto.nombre && dto.nombre !== doc.nombre) {
      const existing = await this.findByName(dto.nombre);
      if (existing) {
        const existingDoc = existing as TipoReclamoDocument;
        if (existingDoc._id && existingDoc._id.toString() !== id) {
          throw new ConflictException(`El tipo de reclamo "${dto.nombre}" ya existe.`);
        }
      }
    }
    
    return this.repository.update(id, dto);
  }

  async softDelete(id: string): Promise<TipoReclamoDocument | null> {
    // Verificar que no existan reclamos activos asociados a este tipo
    // Un reclamo está activo si NO está en estado RESUELTO o RECHAZADO
    const reclamosActivos = await this.reclamoModel.find({
      fkTipoReclamo: id,
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
        message: `No se puede eliminar el tipo de reclamo porque tiene ${reclamosActivos.length} reclamo(s) activo(s) asociado(s).`,
        reclamosActivos: reclamosLista,
      });
    }

    return this.repository.softDelete(id);
  }

  async restore(id: string): Promise<TipoReclamoDocument | null> {
    return this.repository.restore(id);
  }

  async findByName(nombre: string): Promise<TipoReclamoDocument | null> {
    return this.repository.findByName(nombre);
  }
}
