import { Reclamo } from '../../schemas/reclamo.schema';
import { UpdateEncargadosDto } from '../../dto/update-encargados.dto';

/**
 * Interface para las operaciones relacionadas a la gestión de encargados
 * (autoasignación, añadir/quitar del equipo, reasignación de área, etc.)
 */
export interface IReclamoEncargadoService {
  /**
   * Autoasigna un encargado a un reclamo y realiza los cambios de estado necesarios.
   */
  autoAssign(reclamoId: string, encargadoId: string): Promise<Reclamo>;

  /**
   * Añade o remueve encargados del equipo de un reclamo en estado EN_REVISION.
   */
  updateTeam(reclamoId: string, adminId: string, data: UpdateEncargadosDto): Promise<void>;

  /**
   * (Opcional) Reasigna el reclamo a una nueva área y realiza las acciones asociadas.
   */
  reassignArea?(reclamoId: string, nuevaAreaId: string, adminId?: string): Promise<Reclamo>;
}
