// src/reclamos/services/interfaces/reclamo.service.interface.ts

import { CreateReclamoDto } from '../../dto/create-reclamo.dto';
import { UpdateReclamoDto } from '../../dto/update-reclamo.dto';
import { GetReclamoQueryDto } from '../../dto/get-reclamo-query.dto';
import { PaginatedReclamoResponseDto } from '../../dto/pag-reclamo-response.dto';
import { UpdateEncargadosDto } from '../../dto/update-encargados.dto';
import { Reclamo } from '../../schemas/reclamo.schema';

export interface IReclamoService {
  // ==================================================================
  // LÓGICA DEL CLIENTE (US 7)
  // ==================================================================

  /**
   * Crea un nuevo reclamo asociado al cliente y al área del proyecto seleccionado.
   */
  create(data: CreateReclamoDto, userId: string, file?: any): Promise<Reclamo>;

  /**
   * Obtiene la lista de reclamos paginada y filtrada.
   * Si userRole es 'Cliente', filtra por userId (solo sus reclamos).
   * Si userRole es 'Encargado' o 'Gerente', devuelve todos los reclamos.
   */
  findAll(query: GetReclamoQueryDto, userId: string, userRole?: string): Promise<PaginatedReclamoResponseDto>;

  /**
   * Obtiene un reclamo por ID con sus relaciones pobladas.
   * Si userRole es 'Encargado' o 'Gerente', incluye los encargados asignados.
   * Si es 'Cliente' o no autenticado, no incluye los encargados.
   */
  findById(id: string, userRole?: string): Promise<Reclamo>;

  /**
   * Modifica título y descripción. Solo permitido si el reclamo está en PENDIENTE.
   */
  update(id: string, data: UpdateReclamoDto, userId: string): Promise<Reclamo>;

  /**
   * Elimina lógicamente un reclamo. Solo permitido si el reclamo está en PENDIENTE.
   */
  softDelete(id: string, userId: string): Promise<Reclamo>;

  /**
   * Restaura un reclamo eliminado lógicamente.
   */
  restore(id: string, userId: string): Promise<Reclamo>;

  findDeleted(): Promise<Reclamo[]>;

  // ==================================================================
  // LÓGICA DE FLUJO DE TRABAJO (US 11, US 12, US 8)
  // ==================================================================

  reassignArea(reclamoId: string, nuevaAreaId: string): Promise<Reclamo>;
  reassignAreaWithActor(reclamoId: string, nuevaAreaId: string, actorId: string): Promise<Reclamo>;

  /**
   * Cambia el estado de un reclamo (p. ej. a En Revisión, Resuelto, Rechazado).
   * actorRole/actorId se usan para validar permisos (Encargado debe estar asignado al reclamo).
   */
  changeState(reclamoId: string, data: import('../../dto/change-state.dto').ChangeStateDto, actorId: string, actorRole: string): Promise<Reclamo>;

  /**
   * Actualiza una imagen asociada a un reclamo (solo propietario y reclamo en estado PENDIENTE).
   */
  // updateImagen moved to ImagenService
}

export const IRECLAMO_SERVICE = 'IReclamoService';