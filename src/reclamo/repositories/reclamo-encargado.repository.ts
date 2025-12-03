// src/reclamos/repositories/reclamo-encargado.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReclamoEncargado } from '../schemas/reclamo-encargado.schema';
import { IReclamoEncargadoRepository } from './interfaces/reclamo-encargado.repository.interface';

@Injectable()
export class ReclamoEncargadoRepository implements IReclamoEncargadoRepository {
  constructor(
    @InjectModel(ReclamoEncargado.name)
    private readonly model: Model<ReclamoEncargado>,
  ) { }

  async assignEncargado(reclamoId: string, encargadoId: string, isPrincipal: boolean = false): Promise<ReclamoEncargado> {
    const createdAssignment = new this.model({
      fkReclamo: new Types.ObjectId(reclamoId),
      fkEncargado: new Types.ObjectId(encargadoId),
      isPrincipal,
    });
    return createdAssignment.save();
  }

  async unassignEncargado(reclamoId: string, encargadoId: string): Promise<void> {
    await this.model.deleteOne({
      fkReclamo: new Types.ObjectId(reclamoId),
      fkEncargado: new Types.ObjectId(encargadoId),
    }).exec();
  }

  async deleteAllByReclamo(reclamoId: string): Promise<void> {
    await this.model.deleteMany({
      fkReclamo: new Types.ObjectId(reclamoId),
    }).exec();
  }

  async countEncargadosByReclamo(reclamoId: string): Promise<number> {
    return this.model.countDocuments({
      fkReclamo: new Types.ObjectId(reclamoId),
    }).exec();
  }

  async isEncargadoAssigned(reclamoId: string, encargadoId: string): Promise<boolean> {
    const count = await this.model.countDocuments({
      fkReclamo: new Types.ObjectId(reclamoId),
      fkEncargado: new Types.ObjectId(encargadoId),
    }).exec();
    return count > 0;
  }

  async findEncargadosIdsByReclamo(reclamoId: string): Promise<string[]> {
    const results = await this.model
      .find({ fkReclamo: new Types.ObjectId(reclamoId) })
      .select('fkEncargado')
      .exec();

    return results.map((doc) => doc.fkEncargado.toString());
  }

  async findEncargadosByReclamo(reclamoId: string): Promise<ReclamoEncargado[]> {
    return this.model
      .find({ fkReclamo: new Types.ObjectId(reclamoId) })
      .populate('fkEncargado', 'firstName lastName email role') // Poblar datos del usuario
      .exec();
  }

  async findPrincipalEncargado(reclamoId: string): Promise<ReclamoEncargado | null> {
    return this.model
      .findOne({ 
        fkReclamo: new Types.ObjectId(reclamoId),
        isPrincipal: true 
      })
      .populate('fkEncargado', 'firstName lastName email role')
      .exec();
  }

  async updateIsPrincipal(reclamoId: string, encargadoId: string, isPrincipal: boolean): Promise<void> {
    await this.model.updateOne(
      {
        fkReclamo: new Types.ObjectId(reclamoId),
        fkEncargado: new Types.ObjectId(encargadoId),
      },
      { $set: { isPrincipal } }
    ).exec();
  }
}