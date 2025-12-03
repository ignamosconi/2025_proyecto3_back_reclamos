import { ReclamoEncargado } from "src/reclamo/schemas/reclamo-encargado.schema";

export interface IReclamoEncargadoRepository {
  /**
   * Crea el vínculo entre un reclamo y un encargado.
   */
  assignEncargado(reclamoId: string, encargadoId: string, isPrincipal?: boolean): Promise<ReclamoEncargado>;

  /**
   * Elimina el vínculo entre un reclamo y un encargado específico.
   */
  unassignEncargado(reclamoId: string, encargadoId: string): Promise<void>;

  /**
   * Elimina TODOS los encargados asociados a un reclamo (Usado al reasignar área - US 8).
   */
  deleteAllByReclamo(reclamoId: string): Promise<void>;

  /**
   * Cuenta cuántos encargados tiene asignados actualmente un reclamo.
   */
  countEncargadosByReclamo(reclamoId: string): Promise<number>;

  /**
   * Verifica si un encargado específico ya está asignado a un reclamo.
   */
  isEncargadoAssigned(reclamoId: string, encargadoId: string): Promise<boolean>;

  /**
   * Obtiene la lista de IDs de los encargados asignados (útil para validaciones o notificaciones).
   */
  findEncargadosIdsByReclamo(reclamoId: string): Promise<string[]>;

  /**
   * Obtiene la lista de encargados asignados con sus datos poblados.
   */
  findEncargadosByReclamo(reclamoId: string): Promise<ReclamoEncargado[]>;

  /**
   * Obtiene el encargado principal (autoasignado) de un reclamo.
   */
  findPrincipalEncargado(reclamoId: string): Promise<ReclamoEncargado | null>;
}

export const IReclamoEncargadoRepository = Symbol('IReclamoEncargadoRepository');