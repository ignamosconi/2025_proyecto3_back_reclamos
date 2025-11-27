import { CreateReclamoDto } from "src/reclamo/dto/create-reclamo.dto";
import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { GetReclamoQueryDto } from "src/reclamo/dto/get-reclamo-query.dto";
import { PaginatedReclamoResponseDto } from "src/reclamo/dto/pag-reclamo-response.dto";
import { ReclamoResponseDto } from "src/reclamo/dto/reclamo-response.dto";
import { UpdateEncargadosDto } from "src/reclamo/dto/update-encargados.dto";
import { UpdateReclamoDto } from "src/reclamo/dto/update-reclamo.dto";



export interface IReclamoController {

  createReclamo(
    data: CreateReclamoDto,
    req: RequestWithUser, // Request autenticada inyectada por AuthGuard
  ): Promise<ReclamoResponseDto>;

  findMyReclamos(
    query: GetReclamoQueryDto,
    req: RequestWithUser,
  ): Promise<PaginatedReclamoResponseDto>;

  getReclamoById(id: string): Promise<ReclamoResponseDto>;

  updateReclamo(
    id: string,
    data: UpdateReclamoDto,
    req: RequestWithUser,
  ): Promise<ReclamoResponseDto>;

  deleteReclamo(id: string, req: RequestWithUser): Promise<void>;

  restoreReclamo(id: string, req: RequestWithUser): Promise<ReclamoResponseDto>;

  // --- Encargado/Flujo de Trabajo (US 11, US 12, US 8) ---
  autoAssignReclamo(reclamoId: string, encargadoId: string): Promise<ReclamoResponseDto>;

  updateReclamoTeam(
    reclamoId: string,
    adminId: string,
    data: UpdateEncargadosDto,
  ): Promise<void>;

  reassignReclamoArea(
    reclamoId: string,
    nuevaAreaId: string,
    adminId: string,
  ): Promise<ReclamoResponseDto>;
}

export const IReclamoController = Symbol('IReclamoController');