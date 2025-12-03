import { CreateClientDto } from '../dto/create-client.dto';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { UserDocument } from '../schemas/user.schema';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';
import { PaginationResponseUserDto } from '../dto/pag-response-user.dto';
import { ResetPasswordUserDto } from '../dto/reset-pswd.dto';

export interface IUsersRepository {
  createClient(dto: CreateClientDto): Promise<UserDocument>;
  createStaff(dto: CreateStaffDto): Promise<UserDocument>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findRawById(id: string): Promise<UserDocument | null>;
  findAll(query: GetUsersQueryDto): Promise<PaginationResponseUserDto>;
  findDeleted(query: GetUsersQueryDto): Promise<PaginationResponseUserDto>;

  softDelete(id: string): Promise<UserDocument | null>;
  restore(id: string): Promise<UserDocument | null>;
  findByResetToken(token: string): Promise<UserDocument | null>;
  findEncargadosByArea(areaId: string): Promise<UserDocument[]>;

  /*
    FUNCIÓN UPDATE 
 
    - OPERADOR OR (|): Partial<UpdateProfileDto | UpdateStaffDto>:
      Permite que la actualización provenga de cualquiera de los DTOs públicos
      usados en los endpoints (profile -cliente- o staff -gerente/encargado-). Estos DTOs son 
      validados con class-validator y representan únicamente los campos que el cliente puede enviar.
 
    - OPERADOR AND (&): & Partial<ResetPasswordUserDto>:
      Permite que el backend agregue campos internos usados para la lógica de
      recuperación de contraseñas (resetPasswordToken y resetPasswordExpires).
      Este DTO NO SE EXPONE EN CONTROLADORES, no aparece en Swagger y no debe
      ser enviado por el cliente. Solo se usa internamente desde el service.
 
    Esta combinación garantiza que:
    - El cliente sólo pueda actualizar campos permitidos por los DTOs públicos.
    - El backend pueda trabajar atributos no deben ser visibles externamente.
 */
  update(
    id: string, 
    dto: Partial<(UpdateProfileDto | UpdateStaffDto)> & Partial<ResetPasswordUserDto>
  ): Promise<UserDocument | null>;
}

export const IUSERS_REPOSITORY = 'IUsersRepository';
