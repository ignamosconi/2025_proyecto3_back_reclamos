import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comentario } from '../schemas/comentario.schema';
import { IComentarioRepository } from './interfaces/comentario.repository.interface';

@Injectable()
export class ComentarioRepository implements IComentarioRepository {
  constructor(
    @InjectModel(Comentario.name)
    private readonly comentarioModel: Model<Comentario>,
  ) {}

  async create(
    texto: string,
    autorId: string,
    reclamoId: string,
  ): Promise<Comentario> {
    const comentario = new this.comentarioModel({
      texto,
      autor: new Types.ObjectId(autorId),
      fkReclamo: new Types.ObjectId(reclamoId),
      fecha_hora: new Date(),
    });
    return comentario.save();
  }

  async findByReclamoId(reclamoId: string): Promise<Comentario[]> {
    return this.comentarioModel
      .find({ fkReclamo: new Types.ObjectId(reclamoId) })
      .populate('autor', 'firstName lastName email')
      .sort({ fecha_hora: -1 }) // Más recientes primero
      .exec();
  }

  async countByReclamoId(reclamoId: string): Promise<number> {
    return this.comentarioModel
      .countDocuments({ fkReclamo: new Types.ObjectId(reclamoId) })
      .exec();
  }
}

