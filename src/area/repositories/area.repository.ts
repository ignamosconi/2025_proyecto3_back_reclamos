// src/areas/repositories/area.repository.ts

import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IAreaRepository } from './interfaces/i-area.repository';
import { Area, AreaDocument } from '../schemas/area.schema';
import { CreateAreaDto } from '../dto/create-area.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';

// NOTA: Para implementar 'hasActiveClaims', necesitaríamos inyectar
// el modelo de Reclamos, lo cual se hará al crear ese módulo. 
// Aquí lo dejaremos como un placeholder.

@Injectable()
export class AreaRepository implements IAreaRepository {
  constructor(
    @InjectModel(Area.name) private areaModel: Model<AreaDocument>,
    // @InjectModel(Claim.name) private claimModel: Model<ClaimDocument>, // Placeholder
  ) {}

  async create(data: CreateAreaDto): Promise<AreaDocument> {
    const createdArea = new this.areaModel(data);
    return createdArea.save();
  }

  async findById(id: string): Promise<AreaDocument | null> {
    // Solo devuelve áreas activas
    return this.areaModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  async findAll(): Promise<AreaDocument[]> {
    // Devuelve todas las áreas activas
    return this.areaModel.find({ isDeleted: false }).exec();
  }

  async update(id: string, data: UpdateAreaDto): Promise<AreaDocument | null> {
    // Busca y actualiza solo si el área no está eliminada
    return this.areaModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<boolean> {
    // Marca como eliminado solo si existe y no estaba eliminado previamente
    const result = await this.areaModel
      .updateOne({ _id: id, isDeleted: false }, { isDeleted: true })
      .exec();
      
    // Devuelve true si se modificó exactamente 1 documento
    return result.modifiedCount === 1;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const query: any = { 
      name, 
      isDeleted: false 
    }; 

    if (excludeId) {
      query._id = { $ne: excludeId }; 
    }

    const count = await this.areaModel.countDocuments(query).exec();
    return count > 0;
  }

  // --- RESTRICCIÓN DE ELIMINACIÓN ---
  async hasActiveClaims(areaId: string): Promise<boolean> {
    // Lógica pendiente de implementación (necesita el modelo de Reclamos)
    
    /*
      Ejemplo de lo que se haría:
      const activeClaim = await this.claimModel.findOne({
          responsibleArea: areaId,
          state: { $nin: ['Resuelto', 'Rechazado'] } // No está en estado resuelto o rechazado
      }).exec();
      return !!activeClaim;
    */

    return false; // Retornamos false por ahora para no bloquear el desarrollo.
  }
}