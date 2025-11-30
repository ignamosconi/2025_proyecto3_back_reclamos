// src/sintesis/services/sintesis.service.ts

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ISintesisRepository } from '../repositories/interfaces/sintesis.repository.interface';
import { ISINTESIS_REPOSITORY } from '../repositories/interfaces/sintesis.repository.interface';
import { ISintesisService } from './interfaces/sintesis.service.interface';
import { CreateSintesisDto } from '../dto/create-sintesis.dto';
import { SintesisDocument } from '../schemas/sintesis.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { UserRole } from 'src/users/helpers/enum.roles';
import type { IReclamoService } from 'src/reclamo/service/interfaces/reclamo.service.interface';

@Injectable()
export class SintesisService implements ISintesisService {
  private readonly logger = new Logger(SintesisService.name);
  private _reclamoService: IReclamoService;

  constructor(
    @Inject(ISINTESIS_REPOSITORY)
    private readonly repository: ISintesisRepository,
    private readonly moduleRef: ModuleRef,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private get reclamoService(): IReclamoService {
    if (!this._reclamoService) {
      this._reclamoService = this.moduleRef.get<IReclamoService>('IReclamoService', { strict: false });
    }
    return this._reclamoService;
  }

  // ==================================================================
  // LÓGICA DE CREACIÓN (US 10)
  // ==================================================================

  async create(
    data: CreateSintesisDto,
    reclamoId: string,
    creadorId: string,
    areaId: string,
  ): Promise<SintesisDocument> {
    // Nota: La validación del reclamo y la longitud de la síntesis se hace en ReclamoService
    // antes de llamar a este método. Esta validación es una capa adicional de seguridad.
    
    // 1. Validar longitud de descripción
    if (data.descripcion && data.descripcion.length > 1000) {
      throw new BadRequestException('La descripción de la síntesis no puede exceder los 1000 caracteres.');
    }

    // 2. Validar longitud de nombre si se proporciona
    if (data.nombre && data.nombre.length > 255) {
      throw new BadRequestException('El nombre de la síntesis no puede exceder los 255 caracteres.');
    }

    this.logger.log(`Creando síntesis para reclamo ${reclamoId} por usuario ${creadorId}`);
    return this.repository.create(data, reclamoId, creadorId, areaId);
  }

  // ==================================================================
  // LÓGICA DE CONSULTA (US 10)
  // ==================================================================

  async findByReclamoId(
    reclamoId: string,
    userRole: string,
    userId: string,
  ): Promise<SintesisDocument[]> {
    // Validación de acceso se hace en el servicio de reclamo
    const reclamo = await this.reclamoService.findById(reclamoId, userId, userRole);

    return this.repository.findByReclamoId(reclamoId);
  }

  async findById(
    id: string,
    reclamoId: string,
    userRole: string,
    userId: string,
  ): Promise<SintesisDocument | null> {
    const sintesis = await this.repository.findById(id);
    if (!sintesis) {
      return null;
    }

    // Validar que la síntesis pertenezca al reclamo especificado
    const sintesisReclamoId = sintesis.fkReclamo && (sintesis.fkReclamo as any)._id
      ? String((sintesis.fkReclamo as any)._id)
      : String(sintesis.fkReclamo);
    
    if (sintesisReclamoId !== reclamoId) {
      throw new NotFoundException('Síntesis no encontrada para el reclamo especificado.');
    }

    // Validación de acceso se hace en el servicio de reclamo
    const reclamo = await this.reclamoService.findById(reclamoId, userId, userRole);

    return sintesis;
  }
}

