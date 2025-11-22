import { Controller, Post, Body, Patch, Get, Param, Inject, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { IUsersController } from './interfaces/users.controller.interface';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { ParseObjectIdPipe } from '../common/pipes/objectId.pipe';
import { UserDocument } from './schemas/user.schema';
import { PaginationResponseUserDto } from './dto/pag-response-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import type { IUsersService } from './interfaces/users.service.interface';
import { IUSERS_SERVICE } from './interfaces/users.service.interface';

@ApiTags('users')
@Controller('users')
export class UsersController implements IUsersController {
  constructor(
    @Inject(IUSERS_SERVICE)
    private readonly service: IUsersService,
  ) {}

  @Post('register-client')
  @ApiOperation({ summary: 'Registrar un cliente' })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({ status: 201, description: 'Cliente creado', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  registerClient(@Body() dto: CreateClientDto): Promise<Omit<UserDocument, 'password'>> {
    return this.service.registerClient(dto);
  }

  @Post('register-staff')
  @ApiOperation({ summary: 'Registrar un staff' })
  @ApiBody({ type: CreateStaffDto })
  @ApiResponse({ status: 201, description: 'Staff creado', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  createStaff(@Body() dto: CreateStaffDto): Promise<Omit<UserDocument, 'password'>> {
    return this.service.createStaff(dto);
  }

  @Patch('profile/:userId')
  @ApiOperation({ summary: 'Actualizar perfil de un cliente' })
  @ApiParam({ name: 'userId', type: String })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Perfil actualizado', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Usuario no encontrado o validación fallida' })
  updateProfile(
    @Param('userId', ParseObjectIdPipe) userId: string, 
    @Body() dto: UpdateProfileDto,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    return this.service.updateProfile(userId, dto);
  }

  @Patch('staff/:userId')
  @ApiOperation({ summary: 'Actualizar un staff' })
  @ApiParam({ name: 'userId', type: String })
  @ApiBody({ type: UpdateStaffDto })
  @ApiResponse({ status: 200, description: 'Staff actualizado', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Usuario no encontrado o validación fallida' })
  updateStaff(
    @Param('userId', ParseObjectIdPipe) userId: string, 
    @Body() dto: UpdateStaffDto,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    return this.service.updateStaff(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios paginados' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'rol', required: false, enum: ['Cliente', 'Encargado', 'Gerente'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Usuarios obtenidos', type: PaginationResponseUserDto })
  findAll(
    @Query() query: GetUsersQueryDto
  ): Promise<PaginationResponseUserDto> {
    return this.service.findAll(query);
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Listar usuarios eliminados' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Usuarios eliminados obtenidos', type: PaginationResponseUserDto })
  findDeleted(
    @Query() query: GetUsersQueryDto
  ): Promise<PaginationResponseUserDto> {
    return this.service.findDeleted(query);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Buscar usuario por email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findByEmail(@Param('email') email: string): Promise<Omit<UserDocument, 'password'> | null> {
    return this.service.findByEmail(email);
  }

  @Get('id/:userId')
  @ApiOperation({ summary: 'Buscar usuario por ID' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findById(@Param('userId', ParseObjectIdPipe) userId: string): Promise<Omit<UserDocument, 'password'> | null> {
    return this.service.findById(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Eliminar un usuario (soft delete)' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Usuario eliminado', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Usuario no encontrado o ya eliminado' })
  softDelete(
    @Param('userId', ParseObjectIdPipe) userId: string
  ): Promise<Omit<UserDocument, 'password'> | null> {
    return this.service.softDelete(userId);
  }

  @Patch(':userId/restore')
  @ApiOperation({ summary: 'Restaurar un usuario eliminado' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Usuario restaurado', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Usuario no encontrado' })
  restore(
    @Param('userId', ParseObjectIdPipe) userId: string
  ): Promise<Omit<UserDocument, 'password'> | null> {
    return this.service.restore(userId);
  }
}
