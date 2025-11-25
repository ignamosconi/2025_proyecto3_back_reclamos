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
  create(data: CreateReclamoDto, userId: string): Promise<Reclamo>;

  /**
   * Obtiene la lista de reclamos paginada y filtrada.
   */
  findAll(query: GetReclamoQueryDto, userId: string): Promise<PaginatedReclamoResponseDto>;

  /**
   * Obtiene un reclamo por ID con sus relaciones pobladas.
   */
  findById(id: string): Promise<Reclamo>;

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

  // ==================================================================
  // LÓGICA DE FLUJO DE TRABAJO (US 11, US 12, US 8)
  // ==================================================================

  /**
   * Autoasignación de un encargado a un reclamo PENDIENTE (US 11).
   */
  autoAssign(reclamoId: string, encargadoId: string): Promise<Reclamo>;

  /**
   * Añadir o eliminar Encargados de equipo de un reclamo EN REVISIÓN (US 12).
   */
  updateTeam(reclamoId: string, adminId: string, data: UpdateEncargadosDto): Promise<void>;

  /**
   * Reasigna el reclamo a una nueva Área. Limpia encargados y cambia a PENDIENTE (US 8).
   */
  reassignArea(reclamoId: string, nuevaAreaId: string): Promise<Reclamo>;
}