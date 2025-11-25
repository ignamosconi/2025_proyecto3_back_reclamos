import { CreateClientDto } from '../dto/create-client.dto';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { UserDocument } from '../schemas/user.schema';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';
import { PaginationResponseUserDto } from '../dto/pag-response-user.dto';

export interface IUsersRepository {
  createClient(dto: CreateClientDto): Promise<UserDocument>;
  createStaff(dto: CreateStaffDto): Promise<UserDocument>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findRawById(id: string): Promise<UserDocument | null>;
  findAll(query: GetUsersQueryDto): Promise<PaginationResponseUserDto>;
  findDeleted(query: GetUsersQueryDto): Promise<PaginationResponseUserDto>;
  update(id: string, dto: Partial<UpdateProfileDto | UpdateStaffDto>): Promise<UserDocument | null>;
  softDelete(id: string): Promise<UserDocument | null>;
  restore(id: string): Promise<UserDocument | null>;
}

export const IUSERS_REPOSITORY = 'IUsersRepository';
