import { UpdateEncargadosDto } from "src/reclamo/dto/update-encargados.dto";
import { ReclamoResponseDto } from "src/reclamo/dto/reclamo-response.dto";
import { RequestWithUser } from "src/auth/interfaces/request-with-user.interface";

export interface IReclamoEncargadoController {
     autoAssign(
          reclamoId: string,
          encargadoId: string,
          req: RequestWithUser,
     ): Promise<ReclamoResponseDto>;

     updateTeam(
          reclamoId: string,
          data: UpdateEncargadosDto,
          req: RequestWithUser,
     ): Promise<void>;
}

export const IReclamoEncargadoController = Symbol('IReclamoEncargadoController');
