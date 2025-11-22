import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Area, AreaDocument } from './schemas/area.schema';
import { IAreasResponsablesRepository } from './interfaces/areas-responsables.repository.interface';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { GetAreasQueryDto } from './dto/get-area-query.dto';
import { PaginationResultDto } from './dto/pagination-result.dto';

@Injectable()
export class AreasResponsablesRepository implements IAreasResponsablesRepository {
  constructor(@InjectModel(Area.name) private readonly model: Model<AreaDocument>) {}

  async create(data: CreateAreaDto): Promise<AreaDocument> {
    return (await this.model.create(data)).save();
  }

  async findAll(query: GetAreasQueryDto): Promise<PaginationResultDto<AreaDocument>> {
    const { page = 1, limit = 10, sort = 'asc' } = query;

    const filter = { deletedAt: null };
    const total = await this.model.countDocuments(filter);

    const data = await this.model
      .find(filter)
      .sort({ createdAt: sort === 'asc' ? 1 : -1 }) //Ordenamos por fecha de creación
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { data, total, page, limit };
  }

  async findDeleted(query: GetAreasQueryDto): Promise<PaginationResultDto<AreaDocument>> {
    const { page = 1, limit = 10, sort = 'asc' } = query;

    const filter = { deletedAt: { $ne: null } };
    const total = await this.model.countDocuments(filter);

    const data = await this.model
      .find(filter)
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<AreaDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: UpdateAreaDto): Promise<AreaDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async softDelete(id: string): Promise<AreaDocument | null> {
    const area = await this.model.findById(id).exec();
    if (!area) throw new BadRequestException(`Área con id ${id} no existe`);
    if (area.deletedAt) throw new BadRequestException(`Área "${area.nombre}" ya está borrada.`);
    area.deletedAt = new Date();
    return area.save();
  }

  async restore(id: string): Promise<AreaDocument | null> {
    return this.model.findByIdAndUpdate(id, { deletedAt: null }, { new: true }).exec();
  }

  async findByName(nombre: string): Promise<AreaDocument | null> {
    return this.model.findOne({ nombre }).exec();
  }

  async findRawById(id: string): Promise<AreaDocument | null> {
    return this.model.findById(id).exec();
  }
}
