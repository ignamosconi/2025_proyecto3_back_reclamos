import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { IAREAS_RESPONSABLES_REPOSITORY } from './interfaces/areas-responsables.repository.interface';
import type { IAreasResponsablesRepository } from './interfaces/areas-responsables.repository.interface';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { GetAreasQueryDto } from './dto/get-area-query.dto';
import { AreaDocument } from './schemas/area.schema';
import { PaginationResultDto } from './dto/pagination-result.dto';

@Injectable()
export class AreasResponsablesService {
  constructor(
    @Inject(IAREAS_RESPONSABLES_REPOSITORY)
    private readonly repository: IAreasResponsablesRepository,
  ) {}

  async create(dto: CreateAreaDto) {
    const existing = await this.findByName(dto.nombre);
    if (existing) throw new ConflictException(`El área "${dto.nombre}" ya existe.`);
    return this.repository.create(dto);
  }

  async findAll(query: GetAreasQueryDto): Promise<PaginationResultDto<AreaDocument>> {
    return this.repository.findAll(query);
  }

  async findDeleted(query: GetAreasQueryDto): Promise<PaginationResultDto<AreaDocument>> {
    return this.repository.findDeleted(query);
  }

  async findOne(id: string): Promise<AreaDocument | null> {
    return this.repository.findOne(id);
  }

  async update(id: string, data: UpdateAreaDto): Promise<AreaDocument | null> {
    const area = await this.repository.findRawById(id);
    if (!area) throw new BadRequestException(`Área con id ${id} no encontrada.`);
    if (area.deletedAt) throw new BadRequestException(`No se puede actualizar un área soft-deleted.`);
    return this.repository.update(id, data);
  }

  async softDelete(id: string): Promise<AreaDocument | null> {
    return this.repository.softDelete(id);
  }

  async restore(id: string): Promise<AreaDocument | null> {
    return this.repository.restore(id);
  }

  async findByName(nombre: string): Promise<AreaDocument | null> {
    return this.repository.findByName(nombre);
  }
}
