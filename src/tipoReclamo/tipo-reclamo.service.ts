import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import type { ITipoReclamoRepository } from './interfaces/tipo-reclamo.repository.interface';
import { ITIPO_RECLAMO_REPOSITORY } from './interfaces/tipo-reclamo.repository.interface';
import { CreateTipoReclamoDto } from './dto/create-tipo-reclamo.dto';
import { UpdateTipoReclamoDto } from './dto/update-tipo-reclamo.dto';
import { GetTipoReclamoQueryDto } from './dto/get-tipo-reclamo-query.dto';
import { TipoReclamoDocument } from './schemas/tipo-reclamo.schema';
import { PaginationTipoDto } from './dto/pagination-tipo.dto';

@Injectable()
export class TipoReclamoService {
  constructor(
    @Inject(ITIPO_RECLAMO_REPOSITORY)
    private readonly repository: ITipoReclamoRepository,
  ) {}

  async create(dto: CreateTipoReclamoDto) {
    const existing = await this.findByName(dto.nombre);
    if (existing) throw new ConflictException(`El tipo de reclamo "${dto.nombre}" ya existe.`);
    return this.repository.create(dto);
  }

  async findAll(query: GetTipoReclamoQueryDto): Promise<PaginationTipoDto> {
    return this.repository.findAll(query);
  }

  async findDeleted(query: GetTipoReclamoQueryDto): Promise<PaginationTipoDto> {
    return this.repository.findDeleted(query);
  }

  async findOne(id: string): Promise<TipoReclamoDocument | null> {
    return this.repository.findOne(id);
  }

  async update(id: string, dto: UpdateTipoReclamoDto): Promise<TipoReclamoDocument | null> {
    const doc = await this.repository.findRawById(id);
    if (!doc) throw new BadRequestException(`Tipo de reclamo con id ${id} no encontrado`);
    if (doc.deletedAt) throw new BadRequestException(`No se puede actualizar un tipo de reclamo soft-deleted`);
    return this.repository.update(id, dto);
  }

  async softDelete(id: string): Promise<TipoReclamoDocument | null> {
    return this.repository.softDelete(id);
  }

  async restore(id: string): Promise<TipoReclamoDocument | null> {
    return this.repository.restore(id);
  }

  async findByName(nombre: string): Promise<TipoReclamoDocument | null> {
    return this.repository.findByName(nombre);
  }
}
