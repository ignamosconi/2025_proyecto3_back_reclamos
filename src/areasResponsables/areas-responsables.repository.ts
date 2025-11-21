import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Area, AreaDocument } from './schemas/area.schema';
import { IAreasResponsablesRepository } from './interfaces/areas-responsables.repository.interface';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasResponsablesRepository implements IAreasResponsablesRepository {
  constructor(@InjectModel(Area.name) private readonly model: Model<AreaDocument>) {}

  async create(data: CreateAreaDto): Promise<AreaDocument> {
    const doc = new this.model(data);
    return doc.save();
  }

  async findAll(): Promise<AreaDocument[]> {
    return this.model.find({ deletedAt: null }).exec();
  }

  async findOne(id: string): Promise<AreaDocument | null> {
    return this.model.findById(id).exec();
  }

  async findDeleted(): Promise<AreaDocument[]> {
    return this.model.find({ deletedAt: { $ne: null } }).exec();
  }

  async update(id: string, data: UpdateAreaDto): Promise<AreaDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async softDelete(id: string): Promise<AreaDocument | null> {
    const area = await this.model.findById(id).exec();

    if (!area) {
      throw new BadRequestException(`Área con id ${id} no existe`);
    }

    if (area.deletedAt) {
      throw new BadRequestException(`Área "${area.nombre}" ya está borrada`);
    }

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
