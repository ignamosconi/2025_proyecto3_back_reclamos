// src/reclamos/services/reclamos.service.ts

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

// Interfaces y DTOs

import { CreateReclamoDto } from '../dto/create-reclamo.dto';
import { UpdateReclamoDto } from '../dto/update-reclamo.dto';
import { GetReclamoQueryDto } from '../dto/get-reclamo-query.dto';

import { EstadoReclamo } from '../enums/estado.enum';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { IReclamoService } from './interfaces/reclamo.service.interface';
import { IReclamoRepository } from '../repositories/interfaces/reclamo.repository.interface';
import { IReclamoEncargadoRepository } from '../repositories/interfaces/reclamo-encargado.repository.interface';
import { IImagenRepository } from '../repositories/interfaces/imagen.repository.interface';
import type { IProyectosService } from 'src/proyectos/services/proyecto.service.interface';
import { Reclamo } from '../schemas/reclamo.schema';
import { PaginatedReclamoResponseDto } from '../dto/pag-reclamo-response.dto';
import { UpdateEncargadosDto } from '../dto/update-encargados.dto';
import { ReclamoResponseDto } from '../dto/reclamo-response.dto';
import { HistorialService } from 'src/historial/historial.service';
import { AccionesHistorial } from 'src/historial/helpers/acciones-historial.enum';
import type { IMailerService } from 'src/mailer/interfaces/mailer.service.interface';
import { ConfigService } from '@nestjs/config';
import type { ISintesisService } from 'src/sintesis/services/interfaces/sintesis.service.interface';
import { ISINTESIS_SERVICE } from 'src/sintesis/services/interfaces/sintesis.service.interface';
import { SintesisDocument } from 'src/sintesis/schemas/sintesis.schema';

@Injectable()
export class ReclamoService implements IReclamoService {
  private readonly logger = new Logger(ReclamoService.name);

  constructor(
    @Inject('IReclamoRepository')
    private readonly reclamoRepository: IReclamoRepository,

    @Inject('IReclamoEncargadoRepository')
    private readonly reclamoEncargadoRepository: IReclamoEncargadoRepository,

    // Inyectamos el servicio de proyectos para obtener el área
    @Inject('IProyectosService')
    private readonly proyectosService: IProyectosService,

    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(IImagenRepository)
    private readonly imagenRepository: IImagenRepository,
    private readonly historialService: HistorialService,
    @Inject('IMailerService')
    private readonly mailerService: IMailerService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ISINTESIS_SERVICE))
    private readonly sintesisService: ISintesisService,
  ) { }

  // ==================================================================
  // LÓGICA DEL CLIENTE (US 7)
  // ==================================================================

  async create(data: CreateReclamoDto, userId: string, file?: any): Promise<Reclamo> {

    // 1. Validar Cliente (Usuario logueado)
    const clienteExists = await this.userModel.exists({ _id: userId });
    if (!clienteExists) {
      throw new NotFoundException(`Usuario con ID "${userId}" no encontrado.`);
    }

    // 2. Obtener Proyecto y su Área Responsable
    // "El area viene de la mano con proyecto"
    let areaId: string;
    try {
      const proyecto = await this.proyectosService.findById(data.fkProyecto);
      if (!proyecto) { // Doble check por seguridad
        throw new NotFoundException('El proyecto indicado no existe.');
      }
      // Convertimos a string por seguridad. El campo `areaResponsable` puede venir como ObjectId
      // o como documento poblado (objeto). En el segundo caso extraemos su _id.
      if (proyecto.areaResponsable && (proyecto.areaResponsable as any)._id) {
        areaId = String((proyecto.areaResponsable as any)._id);
      } else {
        areaId = String(proyecto.areaResponsable);
      }

      if (!areaId || areaId === 'undefined' || areaId === 'null') {
        throw new ConflictException(`El proyecto "${proyecto.nombre}" no tiene un Área Responsable asignada.`);
      }

    } catch (error) {
      // Capturamos errores del servicio de proyectos
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Error al validar el proyecto asociado.');
    }

    // 3. Crear Reclamo
    const createdReclamo = await this.reclamoRepository.create(data, userId, areaId);

    // 4. Guardar Imagen si existe
    if (file) {
      try {
        await this.imagenRepository.create(
          file.originalname,
          file.mimetype,
          file.buffer,
          String(createdReclamo._id)
        );
      } catch (error) {
        this.logger.error('Error saving image:', error);
      }
    }

    // 5. Crear Historial
    await this.historialService.create(
      String(createdReclamo._id),
      AccionesHistorial.CREACION,
      'Reclamo creado exitosamente.',
      userId,
      { estado_anterior: null, estado_nuevo: createdReclamo.estado },
    );

    return createdReclamo;
  }

  async findAll(query: GetReclamoQueryDto, userId: string, userRole?: string): Promise<PaginatedReclamoResponseDto> {
    // Si es Cliente, filtra por fkCliente. Si es Encargado/Gerente, devuelve todos
    const isClient = userRole === 'Cliente';
    const clientIdFilter: string | undefined = isClient ? userId : undefined;
    
    // Para encargados, filtrar por sus áreas asignadas (US 4)
    let areasIds: string[] | undefined = undefined;
    const roleNormalized = String(userRole || '').toUpperCase();
    if (roleNormalized === 'ENCARGADO') {
      const encargado = await this.userModel.findById(userId).populate('areas').exec();
      if (encargado && encargado.areas && Array.isArray(encargado.areas)) {
        areasIds = encargado.areas.map((area: any) =>
          area && area._id ? String(area._id) : String(area),
        );
        // Si el encargado no tiene áreas asignadas, no podrá ver ningún reclamo
        if (areasIds.length === 0) {
          areasIds = ['000000000000000000000000']; // ID inválido para que no retorne resultados
        }
      }
    }

    const result = await this.reclamoRepository.findAllPaginated(query, clientIdFilter, areasIds);

    // Determinar si el usuario es staff
    const isStaff = userRole === 'ENCARGADO' || userRole === 'GERENTE';

    return {
      // Mapeamos cada documento de Mongoose al formato del DTO
      data: result.data.map((reclamo) => {
        // toObject() convierte el Documento de Mongoose a un objeto plano de JS
        const doc = reclamo.toObject();

        // Solo mostrar encargados si es staff
        if (!isStaff) {
          doc.encargados = undefined;
        }

        return {
          ...doc,
          // Aseguramos que _id sea string (en el DTO es string, en Mongoose es ObjectId)
          _id: doc._id.toString(),
          // Si tienes FKs pobladas o no, toObject las maneja, pero si necesitas strings:
          fkCliente: doc.fkCliente?.toString(),
          fkProyecto: doc.fkProyecto?.toString(),
          fkTipoReclamo: doc.fkTipoReclamo?.toString(),
          fkArea: doc.fkArea?.toString(),
        } as unknown as ReclamoResponseDto; // Casteo final para asegurar compatibilidad
      }),
      total: result.total,
      page: result.page,
      limit: result.limit
    };
  }

  async findById(id: string, userRole?: string): Promise<Reclamo> {
    const reclamo = await this.reclamoRepository.findById(id, true); // populate = true
    if (!reclamo) {
      throw new NotFoundException(`Reclamo con ID ${id} no encontrado.`);
    }

    // Solo mostrar encargados si el usuario es Encargado o Gerente
    const isStaff = userRole === 'ENCARGADO' || userRole === 'GERENTE';
    if (!isStaff) {
      // Remover el campo encargados para usuarios que no sean staff
      (reclamo as any).encargados = undefined;
    }

    return reclamo;
  }

  async update(id: string, data: UpdateReclamoDto, userId: string): Promise<Reclamo> {
    // 1. Validar propiedad y estado
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('El cuerpo de la solicitud no puede estar vacío.');
    }
    const reclamo = await this.validateOwnershipAndStatus(id, userId, EstadoReclamo.PENDIENTE);

    // 2. Actualizar
    const updatedReclamo = await this.reclamoRepository.update(id, data);

    if (!updatedReclamo) {
      throw new NotFoundException(`Fallo al actualizar el Reclamo con ID ${id}.`);
    }

    // Emitir evento para módulo Historial (MODIFICACION) - REMOVIDO POR REQUERIMIENTO

    return updatedReclamo;
  }

  async softDelete(id: string, userId: string): Promise<Reclamo> {
    // 1. Validar propiedad y estado
    const reclamo = await this.validateOwnershipAndStatus(id, userId, EstadoReclamo.PENDIENTE);

    // 2. Eliminar lógicamente
    const deleted = await this.reclamoRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundException(`Fallo al eliminar lógicamente el Reclamo con ID ${id}.`);
    }

    return deleted;
  }

  async restore(id: string, userId: string): Promise<Reclamo> {
    // Para restaurar, no validamos estado PENDIENTE, solo propiedad.
    const reclamo = await this.reclamoRepository.findById(id, false);

    if (!reclamo) throw new NotFoundException(`Reclamo con ID ${id} no encontrado.`);
    if (reclamo.fkCliente.toString() !== userId) throw new ForbiddenException('No tienes permiso para acceder a este reclamo.');
    if (!reclamo.deletedAt) throw new BadRequestException('El reclamo no está eliminado.');

    const restored = await this.reclamoRepository.restore(id);
    if (!restored) {
      throw new NotFoundException(`Fallo al restaurar el Reclamo con ID ${id}.`);
    }

    // Emitir evento para módulo Historial (RESTAURACION) - REMOVIDO POR REQUERIMIENTO

    return restored;
  }

  async findDeleted(): Promise<Reclamo[]> {
    return this.reclamoRepository.findDeleted();
  }

  // ==================================================================
  // LÓGICA DE FLUJO DE TRABAJO (US 11, US 12, US 8)
  // ==================================================================

  async reassignArea(reclamoId: string, nuevaAreaId: string): Promise<Reclamo> {
    // 1. Limpiar encargados
    await this.reclamoRepository.clearEncargados(reclamoId);

    // 2. Actualizar Area y poner en Pendiente
    const updated = await this.reclamoRepository.updateArea(reclamoId, nuevaAreaId);
    if (!updated) throw new NotFoundException('Reclamo no encontrado');

    return updated;
  }

  async reassignAreaWithActor(reclamoId: string, nuevaAreaId: string, actorId: string): Promise<Reclamo> {
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

    const estadoAnterior = reclamo.estado;

    // 1. Limpiar encargados
    await this.reclamoRepository.clearEncargados(reclamoId);

    // 2. Actualizar Area y poner en Pendiente
    const updated = await this.reclamoRepository.updateArea(reclamoId, nuevaAreaId);

    if (!updated) throw new NotFoundException('Reclamo no encontrado');

    // Historial (CAMBIO_AREA)
    await this.historialService.create(
      reclamoId,
      AccionesHistorial.CAMBIO_AREA,
      `Área reasignada.`,
      actorId
    );

    // Historial (CAMBIO_ESTADO)
    if (estadoAnterior !== EstadoReclamo.PENDIENTE) {
      await this.historialService.create(
        reclamoId,
        AccionesHistorial.CAMBIO_ESTADO,
        `Estado cambiado de ${estadoAnterior} a ${EstadoReclamo.PENDIENTE} por reasignación de área.`,
        actorId,
        {
          estado_anterior: estadoAnterior,
          estado_actual: EstadoReclamo.PENDIENTE,
        }
      );
    }

    return updated;
  }

  async changeState(reclamoId: string, data: import('../dto/change-state.dto').ChangeStateDto, actorId: string, actorRole: string): Promise<Reclamo> {
    const { estado: nuevoEstado, sintesis, nombre } = data;

    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

    // 1. No permitir cambios si está en estado final
    if (reclamo.estado === EstadoReclamo.RESUELTO || reclamo.estado === EstadoReclamo.RECHAZADO) {
      throw new BadRequestException('No es posible cambiar el estado de un reclamo en estado final.');
    }

    // 2. Validar transiciones de estado válidas (US 10)
    const transicionesValidas: Record<string, string[]> = {
      [EstadoReclamo.PENDIENTE]: [EstadoReclamo.EN_REVISION],
      [EstadoReclamo.EN_REVISION]: [EstadoReclamo.RESUELTO, EstadoReclamo.RECHAZADO],
    };

    const estadosPermitidos = transicionesValidas[reclamo.estado] || [];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new BadRequestException(
        `Transición de estado inválida. No se puede cambiar de "${reclamo.estado}" a "${nuevoEstado}". ` +
        `Transiciones válidas: ${estadosPermitidos.join(', ')}`,
      );
    }

    // 3. Validaciones de permiso por área (US 4 y US 10)
    const roleNormalized = String(actorRole || '').toUpperCase();
    if (roleNormalized !== 'GERENTE') {
      if (roleNormalized === 'ENCARGADO') {
        // Verificar que el encargado está asignado al reclamo
        const assigned = await this.reclamoEncargadoRepository.isEncargadoAssigned(reclamoId, actorId);
        if (!assigned) {
          throw new ForbiddenException('No estás asignado a este reclamo.');
        }

        // Verificar que el encargado pertenece al área del reclamo
        const encargado = await this.userModel.findById(actorId).populate('areas').exec();
        if (!encargado) {
          throw new NotFoundException('Encargado no encontrado.');
        }

        const reclamoAreaId = reclamo.fkArea && (reclamo.fkArea as any)._id
          ? String((reclamo.fkArea as any)._id)
          : String(reclamo.fkArea);

        const encargadoAreas = (encargado.areas || []).map((area: any) =>
          area && area._id ? String(area._id) : String(area),
        );

        if (!encargadoAreas.includes(reclamoAreaId)) {
          throw new ForbiddenException(
            'No tienes permiso para gestionar reclamos de esta área. Solo puedes gestionar reclamos de tus áreas asignadas.',
          );
        }
      } else {
        throw new ForbiddenException('Rol no autorizado para cambiar el estado.');
      }
    }

    // 4. Requerir síntesis cuando se pasa a estados finales
    if ((nuevoEstado === EstadoReclamo.RESUELTO || nuevoEstado === EstadoReclamo.RECHAZADO) && !sintesis) {
      throw new BadRequestException('Se requiere síntesis/motivo al marcar el reclamo como Resuelto o Rechazado.');
    }

    // 5. Validar longitud de síntesis
    if (sintesis && sintesis.length > 1000) {
      throw new BadRequestException('La síntesis no puede exceder 1000 caracteres.');
    }

    // 6. Actualizar estado
    const updated = await this.reclamoRepository.updateEstado(reclamoId, nuevoEstado);
    if (!updated) throw new NotFoundException('Fallo al actualizar el estado del reclamo');

    // 7. Crear síntesis si se proporciona
    let sintesisCreada: SintesisDocument | null = null;
    if (sintesis) {
      try {
        const reclamoAreaId = reclamo.fkArea && (reclamo.fkArea as any)._id
          ? String((reclamo.fkArea as any)._id)
          : String(reclamo.fkArea);

        sintesisCreada = await this.sintesisService.create(
          {
            nombre: nombre,
            descripcion: sintesis,
          },
          reclamoId,
          actorId,
          reclamoAreaId,
        );

        this.logger.log(`Síntesis creada para reclamo ${reclamoId} por usuario ${actorId}`);
      } catch (error) {
        this.logger.error(`Error creating síntesis for reclamo ${reclamoId}: ${error.message}`, error.stack);
        // No fallar la operación si falla la síntesis, pero loguear el error
      }
    }

    // 8. Emitir evento para Historial
    try {
      await this.historialService.create(
        reclamoId,
        AccionesHistorial.CAMBIO_ESTADO,
        `Estado cambiado de ${reclamo.estado} a ${nuevoEstado}. ${sintesis ? 'Síntesis: ' + sintesis.substring(0, 100) + '...' : ''}`,
        actorId,
        {
          estado_anterior: reclamo.estado,
          estado_actual: nuevoEstado,
          sintesis_id: sintesisCreada ? String(sintesisCreada._id) : undefined,
        },
      );
    } catch (error) {
      this.logger.error(`Error creating history for reclamo ${reclamoId}: ${error.message}`, error.stack);
    }

    // 9. Enviar email de notificación al cliente cuando se crea una síntesis o se cierra el reclamo
    const reclamoConCliente = await this.reclamoRepository.findById(reclamoId, true);
    if (reclamoConCliente && reclamoConCliente.fkCliente) {
      const clienteEmail = (reclamoConCliente.fkCliente as any).email;
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const reclamoLink = `${frontendUrl}/reclamos/${reclamoId}`;

      try {
        if (nuevoEstado === EstadoReclamo.RESUELTO || nuevoEstado === EstadoReclamo.RECHAZADO) {
          // Email de cierre de reclamo
          const estadoTexto = nuevoEstado === EstadoReclamo.RESUELTO ? 'Resuelto' : 'Rechazado';
          const encuestaLink = `${frontendUrl}/reclamos/${reclamoId}/encuesta`;
          const emailSubject = 'Tu reclamo ha sido cerrado - Encuesta de satisfacción';
          const emailBody = `
            <h2>Tu reclamo ha sido cerrado</h2>
            <p>Estimado/a cliente,</p>
            <p>Te informamos que tu reclamo "<strong>${reclamoConCliente.titulo}</strong>" ha sido marcado como <strong>${estadoTexto}</strong>.</p>
            ${sintesisCreada ? `<p><strong>Síntesis:</strong></p><p>${sintesis}</p>` : ''}
            <p>Tu opinión es muy importante para nosotros. Por favor, tómate un momento para completar nuestra encuesta de satisfacción:</p>
            <p><a href="${encuestaLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Completar Encuesta</a></p>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p>${encuestaLink}</p>
            <p>Gracias por tu tiempo.</p>
            <p>Saludos cordiales,<br>Equipo de Programación Avanzada</p>
          `;
          this.mailerService.sendMail(clienteEmail, emailSubject, emailBody);
          this.logger.log(`Email de encuesta enviado a ${clienteEmail} para reclamo ${reclamoId}`);
        } else if (sintesisCreada) {
          // Email de notificación de síntesis (avance)
          const emailSubject = `Actualización en tu reclamo: ${reclamoConCliente.titulo}`;
          const emailBody = `
            <h2>Actualización en tu reclamo</h2>
            <p>Estimado/a cliente,</p>
            <p>Te informamos que ha habido una actualización en tu reclamo "<strong>${reclamoConCliente.titulo}</strong>".</p>
            <p><strong>Nuevo estado:</strong> ${nuevoEstado}</p>
            ${nombre ? `<p><strong>Título de la síntesis:</strong> ${nombre}</p>` : ''}
            <p><strong>Síntesis:</strong></p>
            <p>${sintesis}</p>
            <p><a href="${reclamoLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Reclamo</a></p>
            <p>Saludos cordiales,<br>Equipo de Programación Avanzada</p>
          `;
          this.mailerService.sendMail(clienteEmail, emailSubject, emailBody);
          this.logger.log(`Email de síntesis enviado a ${clienteEmail} para reclamo ${reclamoId}`);
        }
      } catch (error) {
        // Log error but don't fail the state change operation
        this.logger.error(
          `Error al enviar email de notificación para reclamo ${reclamoId}: ${error.message}`,
          error.stack,
        );
      }
    }

    return updated;
  }


  async updateImagen(reclamoId: string, imagenId: string, data: import('../dto/update-imagen.dto').UpdateImagenDto, actorId: string): Promise<import('../schemas/imagen.schema').Imagen> {
    // Verificar que el actor es dueño del reclamo y que está en PENDIENTE
    await this.validateOwnershipAndStatus(reclamoId, actorId, EstadoReclamo.PENDIENTE);

    // Verificar existencia de la imagen y pertenencia al reclamo
    const imagen = await this.imagenRepository.findById(imagenId);
    if (!imagen) throw new NotFoundException('Imagen no encontrada');
    const imagenReclamoId = (imagen as any).fkReclamo ? String((imagen as any).fkReclamo) : String((imagen as any).fkReclamo);
    if (imagenReclamoId !== reclamoId) {
      throw new BadRequestException('La imagen no pertenece al reclamo indicado');
    }

    const updates: Partial<{ nombre: string; tipo: string; imagen: Buffer }> = {};
    if (data.nombre !== undefined) updates.nombre = data.nombre;
    if (data.tipo !== undefined) updates.tipo = data.tipo;
    if (data.imagen !== undefined) {
      // convertir base64 a Buffer
      updates.imagen = Buffer.from(data.imagen, 'base64');
    }

    const updated = await this.imagenRepository.updateById(imagenId, updates);
    if (!updated) throw new NotFoundException('Fallo al actualizar la imagen');

    return updated;
  }

  // ==================================================================
  // HELPERS PRIVADOS
  // ==================================================================

  private async validateOwnershipAndStatus(reclamoId: string, userId: string, requiredStatus: EstadoReclamo): Promise<Reclamo> {
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);

    if (!reclamo) {
      throw new NotFoundException(`Reclamo con ID ${reclamoId} no encontrado.`);
    }

    if (reclamo.deletedAt) {
      throw new NotFoundException(`El reclamo con ID ${reclamoId} ha sido eliminado.`);
    }

    // Asegurarnos de comparar correctamente el ID del cliente aunque fkCliente venga poblado
    const reclamoClienteId = reclamo.fkCliente && (reclamo.fkCliente as any)._id
      ? String((reclamo.fkCliente as any)._id)
      : String(reclamo.fkCliente);

    if (reclamoClienteId !== String(userId)) {
      throw new ForbiddenException('No tienes permiso para modificar este reclamo.');
    }

    if (reclamo.estado !== requiredStatus) {
      throw new BadRequestException(`Solo se pueden modificar reclamos en estado ${requiredStatus}.`);
    }

    return reclamo;
  }
}