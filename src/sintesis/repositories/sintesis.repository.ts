// src/sintesis/repositories/sintesis.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Sintesis, SintesisDocument } from '../schemas/sintesis.schema';
import { ISintesisRepository } from './interfaces/sintesis.repository.interface';

@Injectable()
export class SintesisRepository implements ISintesisRepository {
  constructor(
    @InjectModel(Sintesis.name) private readonly sintesisModel: Model<SintesisDocument>,
  ) {}

  async create(
    data: { nombre?: string; descripcion: string },
    reclamoId: string,
    creadorId: string,
    areaId: string,
  ): Promise<SintesisDocument> {
    const sintesisData = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      fkReclamo: new Types.ObjectId(reclamoId),
      fkCreador: new Types.ObjectId(creadorId),
      fkArea: new Types.ObjectId(areaId),
    };
    return this.sintesisModel.create(sintesisData);
  }

  async findByReclamoId(reclamoId: string): Promise<SintesisDocument[]> {
    // Obtener todas las síntesis de un reclamo, ordenadas por fecha (más reciente primero)
    return this.sintesisModel
      .find({ fkReclamo: new Types.ObjectId(reclamoId) })
      .sort({ createdAt: -1 })
      .populate('fkCreador', 'firstName lastName email role')
      .populate('fkArea', 'nombre descripcion')
      .exec();
  }

  async countByReclamoId(reclamoId: string): Promise<number> {
    // Contar síntesis asociadas a un reclamo
    return this.sintesisModel
      .countDocuments({ fkReclamo: new Types.ObjectId(reclamoId) })
      .exec();
  }

  async findById(id: string): Promise<SintesisDocument | null> {
    // Obtener una síntesis por ID con relaciones pobladas
    return this.sintesisModel
      .findById(id)
      .populate('fkReclamo')
      .populate('fkCreador', 'firstName lastName email role')
      .populate('fkArea', 'nombre descripcion')
      .exec();
  }
}

