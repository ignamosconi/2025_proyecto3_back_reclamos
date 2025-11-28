import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IImagenRepository } from '../repositories/interfaces/imagen.repository.interface';
import { IReclamoRepository } from '../repositories/interfaces/reclamo.repository.interface';
import { CreateImagenDto } from '../dto/create-imagen.dto';
import { UpdateImagenDto } from '../dto/update-imagen.dto';
import { IImagenService } from './interfaces/imagen.service.interface';
import { EstadoReclamo } from '../enums/estado.enum';

@Injectable()
export class ImagenService implements IImagenService {
  constructor(
    @Inject(IImagenRepository)
    private readonly imagenRepository: IImagenRepository,

    @Inject('IReclamoRepository')
    private readonly reclamoRepository: IReclamoRepository,
  ) {}

  async create(reclamoId: string, data: CreateImagenDto, actorId: string) {
    // Validar reclamo y propietario
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

    const reclamoClienteId = reclamo.fkCliente && (reclamo.fkCliente as any)._id
      ? String((reclamo.fkCliente as any)._id)
      : String(reclamo.fkCliente);

    if (reclamoClienteId !== String(actorId)) throw new ForbiddenException('No eres el propietario del reclamo');
    if (reclamo.estado !== EstadoReclamo.PENDIENTE) throw new BadRequestException('Solo se puede adjuntar imagen en reclamos en estado Pendiente');

    const buffer = Buffer.from(data.imagen, 'base64');
    const created = await this.imagenRepository.create(data.nombre, data.tipo, buffer, reclamoId);
    return created;
  }

  async update(reclamoId: string, imagenId: string, data: UpdateImagenDto, actorId: string) {
    // Validar reclamo y propietario
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

    const reclamoClienteId = reclamo.fkCliente && (reclamo.fkCliente as any)._id
      ? String((reclamo.fkCliente as any)._id)
      : String(reclamo.fkCliente);

    if (reclamoClienteId !== String(actorId)) throw new ForbiddenException('No eres el propietario del reclamo');
    if (reclamo.estado !== EstadoReclamo.PENDIENTE) throw new BadRequestException('Solo se puede actualizar imagen en reclamos en estado Pendiente');

    const imagen = await this.imagenRepository.findById(imagenId);
    if (!imagen) throw new NotFoundException('Imagen no encontrada');
    const imagenReclamoId = (imagen as any).fkReclamo ? String((imagen as any).fkReclamo) : String((imagen as any).fkReclamo);
    if (imagenReclamoId !== reclamoId) throw new BadRequestException('La imagen no pertenece al reclamo');

    const updates: Partial<{ nombre: string; tipo: string; imagen: Buffer }> = {};
    if (data.nombre !== undefined) updates.nombre = data.nombre;
    if (data.tipo !== undefined) updates.tipo = data.tipo;
    if (data.imagen !== undefined) updates.imagen = Buffer.from(data.imagen, 'base64');

    const updated = await this.imagenRepository.updateById(imagenId, updates);
    if (!updated) throw new NotFoundException('Fallo al actualizar la imagen');
    return updated;
  }

  async findByReclamo(reclamoId: string) {
    return this.imagenRepository.findByReclamo(reclamoId);
  }

  async findById(imagenId: string) {
    return this.imagenRepository.findById(imagenId);
  }

  async deleteById(imagenId: string, reclamoId: string, actorId: string) {
    // Validar reclamo y propietario
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

    const reclamoClienteId = reclamo.fkCliente && (reclamo.fkCliente as any)._id
      ? String((reclamo.fkCliente as any)._id)
      : String(reclamo.fkCliente);

    if (reclamoClienteId !== String(actorId)) throw new ForbiddenException('No eres el propietario del reclamo');

    const imagen = await this.imagenRepository.findById(imagenId);
    if (!imagen) throw new NotFoundException('Imagen no encontrada');
    const imagenReclamoId = (imagen as any).fkReclamo ? String((imagen as any).fkReclamo) : String((imagen as any).fkReclamo);
    if (imagenReclamoId !== reclamoId) throw new BadRequestException('La imagen no pertenece al reclamo');

    await this.imagenRepository.deleteById(imagenId);
  }
}
