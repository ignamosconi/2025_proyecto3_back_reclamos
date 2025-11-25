import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TipoReclamo, TipoReclamoDocument } from './schemas/tipo-reclamo.schema';
import { ITipoReclamoRepository } from './interfaces/tipo-reclamo.repository.interface';
import { CreateTipoReclamoDto } from './dto/create-tipo-reclamo.dto';
import { UpdateTipoReclamoDto } from './dto/update-tipo-reclamo.dto';
import { GetTipoReclamoQueryDto } from './dto/get-tipo-reclamo-query.dto';
import { PaginationResponseTipoDto } from './dto/pag-response-tipo.dto';

@Injectable()
export class TipoReclamoRepository implements ITipoReclamoRepository {
  constructor(@InjectModel(TipoReclamo.name) private readonly model: Model<TipoReclamoDocument>) {}

  async create(data: CreateTipoReclamoDto): Promise<TipoReclamoDocument> {
    return (await this.model.create(data)).save();
  }

  async findAll(query: GetTipoReclamoQueryDto): Promise<PaginationResponseTipoDto> {
    const { page = 1, limit = 10, sort = 'asc' } = query;
    const filter = { deletedAt: null };
    const total = await this.model.countDocuments(filter);

    const data = await this.model
      .find(filter)
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { data, total, page, limit };
  }

  async findDeleted(query: GetTipoReclamoQueryDto): Promise<PaginationResponseTipoDto> {
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

  async findOne(id: string): Promise<TipoReclamoDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: UpdateTipoReclamoDto): Promise<TipoReclamoDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async softDelete(id: string): Promise<TipoReclamoDocument | null> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new BadRequestException(`Tipo de reclamo con id ${id} no existe`);
    if (doc.deletedAt) throw new BadRequestException(`Tipo de reclamo "${doc.nombre}" ya está borrado`);
    doc.deletedAt = new Date();
    return doc.save();
  }

  async restore(id: string): Promise<TipoReclamoDocument | null> {
    return this.model.findByIdAndUpdate(id, { deletedAt: null }, { new: true }).exec();
  }

  async findByName(nombre: string): Promise<TipoReclamoDocument | null> {
    return this.model.findOne({ nombre }).exec();
  }

  async findRawById(id: string): Promise<TipoReclamoDocument | null> {
    return this.model.findById(id).exec();
  }
}
