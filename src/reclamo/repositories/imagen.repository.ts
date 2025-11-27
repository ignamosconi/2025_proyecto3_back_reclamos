import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Imagen } from '../schemas/imagen.schema';
import { IImagenRepository } from './interfaces/imagen.repository.interface';

@Injectable()
export class ImagenRepository implements IImagenRepository {
  constructor(
    @InjectModel(Imagen.name)
    private readonly model: Model<Imagen>,
  ) {}

  async create(nombre: string, tipo: string, imagenBuffer: Buffer, fkReclamo: string): Promise<Imagen> {
    const doc = new this.model({
      nombre,
      tipo,
      imagen: imagenBuffer,
      fkReclamo: new Types.ObjectId(fkReclamo),
    });
    return doc.save();
  }

  async findByReclamo(reclamoId: string): Promise<Imagen[]> {
    return this.model.find({ fkReclamo: new Types.ObjectId(reclamoId) }).exec();
  }

  async findById(id: string): Promise<Imagen | null> {
    return this.model.findById(id).exec();
  }

  async deleteById(id: string): Promise<void> {
    await this.model.deleteOne({ _id: new Types.ObjectId(id) }).exec();
  }

  async updateById(id: string, updates: Partial<{ nombre: string; tipo: string; imagen: Buffer }>): Promise<Imagen | null> {
    const updateSet: any = {};
    if (updates.nombre !== undefined) updateSet.nombre = updates.nombre;
    if (updates.tipo !== undefined) updateSet.tipo = updates.tipo;
    if (updates.imagen !== undefined) updateSet.imagen = updates.imagen;

    if (Object.keys(updateSet).length === 0) {
      return this.findById(id);
    }

    return this.model.findByIdAndUpdate(id, { $set: updateSet }, { new: true }).exec();
  }
}
