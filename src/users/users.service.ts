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
import { Model } from 'mongoose';
import { Area } from 'src/areasResponsables/schemas/area.schema';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @Inject(IUSERS_REPOSITORY) 
    private readonly repository: IUsersRepository,
    
    @InjectModel('Area')
    private readonly areaModel: Model<Area>,
  ) {}

  private sanitize(user: any) {
    if (!user) return null;
    if (typeof user.toObject === 'function') {
      const { password, ...clean } = user.toObject();
      return clean;
    }
    const { password, ...clean } = user;
    return clean;
  }

  private sanitizePagination(response: PaginationResponseUserDto) {
    return {
      ...response,
      data: response.data.map(u => this.sanitize(u)),
    };
  }

  async registerClient(dto: CreateClientDto) {
    if (await this.repository.findByEmail(dto.email))
      throw new ConflictException('El email ya está registrado');

    // Validar fuerza de la contraseña principal
    validatePasswordStrength(dto.password, dto.email, dto.nombre, dto.apellido);

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

  async createStaff(dto: CreateStaffDto) {
    if (await this.repository.findByEmail(dto.email))
      throw new ConflictException('El email ya está registrado');

    validatePasswordStrength(dto.password, dto.email, dto.nombre, dto.apellido);

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

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.repository.findRawById(userId);
    if (!existing) throw new BadRequestException('Usuario no encontrado');

    if (dto.password) {
      validatePasswordStrength(dto.password, existing.email, existing.nombre, existing.apellido);

      if (dto.password !== dto.passwordConfirmation) {
        throw new BadRequestException({
          message: 'Las contraseñas no coinciden',
          errors: ['passwordConfirmation debe ser igual a password'],
        });
      }
    }

    const updated = await this.repository.update(userId, dto);
    return this.sanitize(updated);
  }

  async updateStaff(userId: string, dto: UpdateStaffDto) {
    delete dto.passwordConfirmation;

    const existing = await this.repository.findRawById(userId);
    if (!existing) throw new BadRequestException('Usuario no encontrado');

    if (dto.password) {
      validatePasswordStrength(dto.password, existing.email, existing.nombre, existing.apellido);
    }

    if (dto.areaIds) {
      for (const areaId of dto.areaIds) {
        const exists = await this.areaModel.findById(areaId);
        if (!exists) throw new BadRequestException(`Área no encontrada: ${areaId}`);
      }
    }

    const updated = await this.repository.update(userId, dto);
    return this.sanitize(updated);
  }

  async findAll(query: GetUsersQueryDto) {
    const response = await this.repository.findAll(query);
    return this.sanitizePagination(response);
  }

  async findDeleted(query: GetUsersQueryDto) {
    const response = await this.repository.findDeleted(query);
    return this.sanitizePagination(response);
  }

  async softDelete(userId: string) {
    const user = await this.repository.softDelete(userId);
    if (!user) throw new BadRequestException(`Usuario con id ${userId} no existe`);
    return this.sanitize(user);
  }

  async restore(userId: string) {
    const user = await this.repository.restore(userId);
    if (!user) throw new BadRequestException(`Usuario con id ${userId} no existe`);
    return this.sanitize(user);
  }
}
