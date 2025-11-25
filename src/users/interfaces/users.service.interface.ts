import { CreateClientDto } from '../dto/create-client.dto';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';
import { PaginationResponseUserDto } from '../dto/pag-response-user.dto';
import { UserDocument } from '../schemas/user.schema';

export interface IUsersService {
  registerClient(dto: CreateClientDto): Promise<Omit<UserDocument, 'password'>>;
  createStaff(dto: CreateStaffDto): Promise<Omit<UserDocument, 'password'>>;
  updateProfile(userId: string, dto: UpdateProfileDto): Promise<Omit<UserDocument, 'password'> | null>;
  updateStaff(userId: string, dto: UpdateStaffDto): Promise<Omit<UserDocument, 'password'> | null>;
  findAll(query: GetUsersQueryDto): Promise<PaginationResponseUserDto>;
  findDeleted(query: GetUsersQueryDto): Promise<PaginationResponseUserDto>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findById(userId: string): Promise<Omit<UserDocument, 'password'> | null>;
  softDelete(userId: string): Promise<Omit<UserDocument, 'password'> | null>;
  restore(userId: string): Promise<Omit<UserDocument, 'password'> | null>;

  
  setResetPasswordToken(userId: string, token: string, expires: Date): Promise<void>;
  sendPasswordResetEmail(email: string, resetLink: string): Promise<void>;
  findByResetToken(token: string): Promise<UserDocument | null>;
  updatePassword(userId: string, newPassword: string): Promise<void>;
}

export const IUSERS_SERVICE = 'IUsersService';