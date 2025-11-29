import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IEncuestaRepository } from '../repositories/interfaces/encuesta.repository.interface';
import { IENCUESTA_REPOSITORY } from '../repositories/interfaces/encuesta.repository.interface';
import { IEncuestaService } from './interfaces/encuesta.service.interface';
import { CreateEncuestaDto } from '../dto/create-encuesta.dto';
import { GetEncuestaQueryDto } from '../dto/get-encuesta-query.dto';
import { EncuestaDocument } from '../schemas/encuesta.schema';
import { PaginationResponseEncuestaDto } from '../dto/pag-response-encuesta.dto';
import type { IReclamoService } from 'src/reclamo/service/interfaces/reclamo.service.interface';
import { EstadoReclamo } from 'src/reclamo/enums/estado.enum';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { UserRole } from 'src/users/helpers/enum.roles';

@Injectable()
export class EncuestaService implements IEncuestaService {
  private readonly logger = new Logger(EncuestaService.name);

  constructor(
    @Inject(IENCUESTA_REPOSITORY)
    private readonly repository: IEncuestaRepository,
    @Inject('IReclamoService')
    private readonly reclamoService: IReclamoService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(
    data: CreateEncuestaDto,
    clienteId: string,
    reclamoId: string,
  ): Promise<EncuestaDocument> {
    // 1. Validar que el reclamo existe
    const reclamo = await this.reclamoService.findById(reclamoId);
    if (!reclamo) {
      this.logger.warn(`Intento de crear encuesta para reclamo inexistente: ${reclamoId}`);
      throw new NotFoundException(`Reclamo con ID ${reclamoId} no encontrado.`);
    }

    // 2. Validar que el reclamo está en estado final (RESUELTO o RECHAZADO)
    if (
      reclamo.estado !== EstadoReclamo.RESUELTO &&
      reclamo.estado !== EstadoReclamo.RECHAZADO
    ) {
      this.logger.warn(
        `Intento de crear encuesta para reclamo en estado ${reclamo.estado} (ID: ${reclamoId})`,
      );
      throw new BadRequestException(
        `Solo se puede crear una encuesta para reclamos en estado final (Resuelto o Rechazado). El reclamo está en estado: ${reclamo.estado}`,
      );
    }

    // 3. Validar que el cliente es el dueño del reclamo
    const reclamoClienteId =
      reclamo.fkCliente && (reclamo.fkCliente as any)._id
        ? String((reclamo.fkCliente as any)._id)
        : String(reclamo.fkCliente);

    if (reclamoClienteId !== String(clienteId)) {
      this.logger.warn(
        `Cliente ${clienteId} intentó crear encuesta para reclamo ${reclamoId} que pertenece a ${reclamoClienteId}`,
      );
      throw new ForbiddenException(
        'No tienes permiso para crear una encuesta para este reclamo.',
      );
    }

    // 4. Verificar si ya existe una encuesta para este reclamo/cliente
    const existing = await this.repository.findByReclamoAndCliente(
      reclamoId,
      clienteId,
    );
    if (existing) {
      this.logger.warn(
        `Intento de crear encuesta duplicada para reclamo ${reclamoId} por cliente ${clienteId}`,
      );
      throw new ConflictException(
        'Ya existe una encuesta para este reclamo. Solo se permite una encuesta por reclamo.',
      );
    }

    // 5. Crear la encuesta
    this.logger.log(`Creando encuesta para reclamo ${reclamoId} por cliente ${clienteId}`);
    return this.repository.create(data, clienteId, reclamoId);
  }

  async findByReclamoId(
    reclamoId: string,
    userRole: string,
    userId: string,
  ): Promise<EncuestaDocument | null> {
    const encuesta = await this.repository.findByReclamoId(reclamoId);

    if (!encuesta) {
      return null;
    }

    // Si el usuario es Cliente, validar que es el dueño de la encuesta
    if (userRole === UserRole.CLIENTE) {
      const encuestaClienteId =
        encuesta.fkClienteCreador && (encuesta.fkClienteCreador as any)._id
          ? String((encuesta.fkClienteCreador as any)._id)
          : String(encuesta.fkClienteCreador);

      if (encuestaClienteId !== String(userId)) {
        this.logger.warn(
          `Cliente ${userId} intentó acceder a encuesta ${encuesta._id} que pertenece a ${encuestaClienteId}`,
        );
        throw new ForbiddenException(
          'No tienes permiso para ver esta encuesta.',
        );
      }
    }

    // Encargado y Gerente pueden ver cualquier encuesta
    return encuesta;
  }

  async findAll(
    query?: GetEncuestaQueryDto,
    userRole?: string,
  ): Promise<PaginationResponseEncuestaDto> {
    // Validar que el rol es Encargado o Gerente
    if (userRole !== UserRole.ENCARGADO && userRole !== UserRole.GERENTE) {
      this.logger.warn(
        `Usuario con rol ${userRole} intentó listar todas las encuestas`,
      );
      throw new ForbiddenException(
        'Solo los roles Encargado y Gerente pueden listar todas las encuestas.',
      );
    }

    this.logger.log(`Listando todas las encuestas (rol: ${userRole})`);
    return this.repository.findAll(query);
  }
}

