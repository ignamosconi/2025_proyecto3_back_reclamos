import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Encuesta, EncuestaDocument } from '../schemas/encuesta.schema';
import { IEncuestaRepository } from './interfaces/encuesta.repository.interface';
import { CreateEncuestaDto } from '../dto/create-encuesta.dto';
import { GetEncuestaQueryDto } from '../dto/get-encuesta-query.dto';
import { PaginationResponseEncuestaDto } from '../dto/pag-response-encuesta.dto';
import { EncuestaResponseDto } from '../dto/encuesta-response.dto';

@Injectable()
export class EncuestaRepository implements IEncuestaRepository {
  constructor(
    @InjectModel(Encuesta.name) private readonly model: Model<EncuestaDocument>,
  ) {}

  async create(
    data: CreateEncuestaDto,
    clienteId: string,
    reclamoId: string,
  ): Promise<EncuestaDocument> {
    const encuestaData = {
      ...data,
      fkReclamo: reclamoId,
      fkClienteCreador: clienteId,
    };
    return this.model.create(encuestaData);
  }

  async findByReclamoId(reclamoId: string): Promise<EncuestaDocument | null> {
    return this.model.findOne({ fkReclamo: reclamoId }).exec();
  }

  async findByReclamoAndCliente(
    reclamoId: string,
    clienteId: string,
  ): Promise<EncuestaDocument | null> {
    return this.model
      .findOne({
        fkReclamo: reclamoId,
        fkClienteCreador: clienteId,
      })
      .exec();
  }

  async findAll(
    query?: GetEncuestaQueryDto,
  ): Promise<PaginationResponseEncuestaDto> {
    const { page = 1, limit = 10, sort = 'asc' } = query || {};

    const filter = {};
    const total = await this.model.countDocuments(filter);

    const data = await this.model
      .find(filter)
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('fkReclamo')
      .populate('fkClienteCreador')
      .exec();

    return {
      data: data.map((encuesta) => {
        const doc = encuesta.toObject() as any;
        return {
          _id: String(doc._id),
          calificacion: doc.calificacion,
          descripcion: doc.descripcion,
          fkReclamo: doc.fkReclamo?.toString() || String(doc.fkReclamo),
          fkClienteCreador: doc.fkClienteCreador?.toString() || String(doc.fkClienteCreador),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        } as EncuestaResponseDto;
      }),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<EncuestaDocument | null> {
    return this.model
      .findById(id)
      .populate('fkReclamo')
      .populate('fkClienteCreador')
      .exec();
  }

  async findRawById(id: string): Promise<EncuestaDocument | null> {
    return this.model.findById(id).exec();
  }
}

