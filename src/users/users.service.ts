import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { IUsersService } from './interfaces/users.service.interface';
import type { IUsersRepository } from './interfaces/users.repository.interface';
import { IUSERS_REPOSITORY } from './interfaces/users.repository.interface';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { validatePasswordStrength } from './helpers/password.validator';
import { PaginationResponseUserDto } from './dto/pag-response-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Area } from 'src/areasResponsables/schemas/area.schema';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @Inject(IUSERS_REPOSITORY) 
    private readonly repository: IUsersRepository,
    
    @InjectModel('Area')
    private readonly areaModel: Model<Area>,
  ) {}

  //Sacamos el password para la respuesta
  private sanitize(user: any) {
    if (!user) return null;
    if (typeof user.toObject === 'function') {
      const { password, ...clean } = user.toObject();
      return clean;
    }
    const { password, ...clean } = user;
    return clean;
  }

  //Sacamos el password para una respuesta paginada.
  private sanitizePagination(response: PaginationResponseUserDto) {
    return {
      ...response,
      data: response.data.map(u => this.sanitize(u)),
    };
  }

  async registerClient(dto: CreateClientDto): Promise<Omit<UserDocument, 'password'>> {
    if (await this.repository.findByEmail(dto.email))
      throw new ConflictException('El email ya está registrado');

    // Validar fuerza de la contraseña principal
    validatePasswordStrength(dto.password, dto.email, dto.firstName, dto.lastName);

    // Validar que coincida con passwordConfirmation
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException({
        message: 'Las contraseñas no coinciden',
        errors: ['passwordConfirmation debe ser igual a password'],
      });
    }

    const user = await this.repository.createClient(dto);
    return this.sanitize(user);
  }

  async createStaff(dto: CreateStaffDto): Promise<Omit<UserDocument, 'password'>> {
    if (await this.repository.findByEmail(dto.email))
      throw new ConflictException('El email ya está registrado');

    validatePasswordStrength(dto.password, dto.email, dto.firstName, dto.lastName);

    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException({
        message: 'Las contraseñas no coinciden',
        errors: ['passwordConfirmation debe ser igual a password'],
      });
    }

    // Validar que las áreas existan
    for (const areaId of dto.areaIds) {
      const exists = await this.areaModel.findById(areaId);
      if (!exists) throw new BadRequestException(`Área no encontrada: ${areaId}`);
    }

    const user = await this.repository.createStaff(dto);
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Omit<UserDocument, 'password'> | null> {
    const existing = await this.repository.findRawById(userId);
    if (!existing) throw new BadRequestException('Usuario no encontrado');
    if (existing.deletedAt) throw new BadRequestException('No se puede modificar un usuario eliminado');

    if (dto.password) {
      validatePasswordStrength(dto.password, existing.email, existing.firstName, existing.lastName);

      if (dto.password !== dto.passwordConfirmation) {
        throw new BadRequestException({
          message: 'Las contraseñas no coinciden',
          errors: ['passwordConfirmation debe ser igual a password'],
        });
      }
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.repository.findByEmail(dto.email);
      if (emailTaken) throw new ConflictException('El email ya está registrado');
    }

    const updated = await this.repository.update(userId, dto);
    return this.sanitize(updated);
  }

  async updateStaff(userId: string, dto: UpdateStaffDto): Promise<Omit<UserDocument, 'password'> | null> {
    delete dto.passwordConfirmation;

    const existing = await this.repository.findRawById(userId);
    if (!existing) throw new BadRequestException('Usuario no encontrado');
    if (existing.deletedAt) throw new BadRequestException('No se puede modificar un usuario eliminado');

    if (dto.password) {
      validatePasswordStrength(dto.password, existing.email, existing.firstName, existing.lastName);
    }

    if (dto.areaIds) {
      if (dto.areaIds.length === 0) {
        throw new BadRequestException('Un staff debe tener al menos un área asignada');
      }

    for (const areaId of dto.areaIds) {
      if (!Types.ObjectId.isValid(areaId)) {
        throw new BadRequestException(`Área inválida: ${areaId}`);
      }
      const exists = await this.areaModel.findById(areaId);
      if (!exists) throw new BadRequestException(`Área no encontrada: ${areaId}`);
    }
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.repository.findByEmail(dto.email);
      if (emailTaken) throw new ConflictException('El email ya está registrado');
    }

    const updated = await this.repository.update(userId, dto);
    return this.sanitize(updated);
  }

  async findAll(query: GetUsersQueryDto): Promise<PaginationResponseUserDto> {
    const response = await this.repository.findAll(query);
    return this.sanitizePagination(response);
  }

  async findDeleted(query: GetUsersQueryDto): Promise<PaginationResponseUserDto> {
    const response = await this.repository.findDeleted(query);
    return this.sanitizePagination(response);
  }

  //No usamos sanitize(user) acá pq este método lo usamos para el login. Si sacamos el pwd, no login.
  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.repository.findByEmail(email);
  }

  async findById(userId: string): Promise<Omit<UserDocument, 'password'> | null> {
    const user = await this.repository.findRawById(userId);
    return this.sanitize(user);
  }

  async softDelete(userId: string): Promise<Omit<UserDocument, 'password'> | null> {
    const user = await this.repository.softDelete(userId);
    if (!user) throw new BadRequestException(`Usuario con id ${userId} no existe`);
    return this.sanitize(user);
  }

  async restore(userId: string): Promise<Omit<UserDocument, 'password'> | null> {
    const user = await this.repository.findRawById(userId);

    if (!user) throw new BadRequestException(`Usuario con id ${userId} no existe`);
    if (!user.deletedAt) throw new BadRequestException('El usuario no está eliminado');

    const restoredUser = await this.repository.restore(userId);
    return this.sanitize(restoredUser);
  }
}
