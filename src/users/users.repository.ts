import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IUsersRepository } from './interfaces/users.repository.interface';
import { User, UserDocument } from './schemas/user.schema';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { PaginationResponseUserDto } from './dto/pag-response-user.dto';
import * as bcrypt from 'bcrypt';
import { ClienteRole } from './helpers/enum.roles';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(@InjectModel(User.name) private readonly model: Model<UserDocument>) {}

  private async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async createClient(dto: CreateClientDto): Promise<UserDocument> {
    const hashed = await this.hash(dto.password);
    return this.model.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashed,
      role: ClienteRole.CLIENTE,
      areas: [],
    });
  }

  async createStaff(dto: CreateStaffDto): Promise<UserDocument> {
    const hashed = await this.hash(dto.password);
    return this.model.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashed,
      role: dto.role,
      areas: dto.areaIds.map(id => new Types.ObjectId(id)),
    });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email }).populate('areas');
  }

  async findRawById(id: string): Promise<UserDocument | null> {
    return this.model.findById(id).populate('areas');
  }

  async findAll(query: GetUsersQueryDto): Promise<PaginationResponseUserDto> {
    const { limit = 10, page = 1, sort = 'asc', role, search } = query;

    const filter: any = { deletedAt: null };
    if (role) filter.role = role;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await this.model.countDocuments(filter);

    const data = await this.model
      .find(filter)
      .populate('areas')
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { data, total, page, limit };
  }

  async findDeleted(query: GetUsersQueryDto): Promise<PaginationResponseUserDto> {
    const { limit = 10, page = 1 } = query;

    const filter = { deletedAt: { $ne: null } };

    const total = await this.model.countDocuments(filter);
    const data = await this.model
      .find(filter)
      .populate('areas')
      .skip((page - 1) * limit)
      .limit(limit);

    return { data, total, page, limit };
  }

  async update(
    id: string,
    dto: Partial<UpdateProfileDto | UpdateStaffDto>,
  ): Promise<UserDocument | null> {
    if (dto.password) {
      dto.password = await this.hash(dto.password);
    }

    const updateData: any = { ...dto };

    // Transformamos areaIds a ObjectId solo si es un staff
    if ('areaIds' in dto && Array.isArray(dto.areaIds)) {
      updateData.areas = dto.areaIds.map(id => new Types.ObjectId(id));
      delete updateData.areaIds;
    }

    return this.model
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('areas');
  }


  async softDelete(id: string): Promise<UserDocument | null> {
    const user = await this.model.findById(id).populate('areas');
    if (!user) throw new BadRequestException('Usuario no encontrado');
    if (user.deletedAt) throw new BadRequestException('El usuario ya está eliminado');

    user.deletedAt = new Date();
    return user.save();
  }

  async restore(id: string): Promise<UserDocument | null> {
    return this.model.findByIdAndUpdate(id, { deletedAt: null }, { new: true });
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    try {
      return await this.model.findOne({resetPasswordToken: token});
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al buscar usuario por token de reseteo. ' + error,
      );
    }
  }
}
