import { Controller, Post, Body, Patch, Get, Param, Inject, Query, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './helpers/enum.roles';
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
    console.log(`[UsersController] POST /users/register-client - Registrando cliente: ${dto.email}`);
    return this.service.registerClient(dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE)
  @Post('register-staff')
  @ApiOperation({ summary: 'Registrar un staff' })
  @ApiBody({ type: CreateStaffDto })
  @ApiResponse({ status: 201, description: 'Staff creado', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  createStaff(@Body() dto: CreateStaffDto): Promise<Omit<UserDocument, 'password'>> {
    console.log(`[UsersController] POST /users/register-staff - Registrando staff: ${dto.email}`);
    return this.service.createStaff(dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
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
    console.log(`[UsersController] PATCH /users/profile/${userId} - Actualizando perfil de Cliente`);
    return this.service.updateProfile(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
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
    console.log(`[UsersController] PATCH /users/staff/${userId} - Actualizando perfil de Staff.`);
    return this.service.updateStaff(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE)
  @Get()
  @ApiOperation({ summary: 'Listar usuarios paginados (Solo Gerente)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'rol', required: false, enum: ['Cliente', 'Encargado', 'Gerente'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Usuarios obtenidos', type: PaginationResponseUserDto })
  findAll(
    @Query() query: GetUsersQueryDto
  ): Promise<PaginationResponseUserDto> {
    console.log(`[UsersController] GET /users - Listando usuarios con query:`, query);
    return this.service.findAll(query);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE)
  @Get('deleted')
  @ApiOperation({ summary: 'Listar usuarios eliminados' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Usuarios eliminados obtenidos', type: PaginationResponseUserDto })
  findDeleted(
    @Query() query: GetUsersQueryDto
  ): Promise<PaginationResponseUserDto> {
    console.log(`[UsersController] GET /users/deleted - Listando usuarios eliminados con query:`,query);
    return this.service.findDeleted(query);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  @Get('email/:email')
  @ApiOperation({ summary: 'Buscar usuario por email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findByEmail(@Param('email') email: string): Promise<Omit<UserDocument, 'password'> | null> {
    console.log(`[UsersController] GET /users/email/${email} - Buscando usuario por email`);
    return this.service.findByEmail(email);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  @Get('id/:userId')
  @ApiOperation({ summary: 'Buscar usuario por ID' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findById(@Param('userId', ParseObjectIdPipe) userId: string): Promise<Omit<UserDocument, 'password'> | null> {
    console.log(`[UsersController] GET /users/id/${userId} - Buscando usuario por ID`);
    return this.service.findById(userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE)
  @Delete(':userId')
  @ApiOperation({ summary: 'Eliminar un usuario (soft delete)' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Usuario eliminado', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Usuario no encontrado o ya eliminado' })
  softDelete(
    @Param('userId', ParseObjectIdPipe) userId: string
  ): Promise<Omit<UserDocument, 'password'> | null> {
    console.log(`[UsersController] DELETE /users/${userId} - Soft-deleting usuario`);
    return this.service.softDelete(userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE)
  @Patch(':userId/restore')
  @ApiOperation({ summary: 'Restaurar un usuario eliminado' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Usuario restaurado', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Usuario no encontrado' })
  restore(
    @Param('userId', ParseObjectIdPipe) userId: string
  ): Promise<Omit<UserDocument, 'password'> | null> {
    console.log(`[UsersController] PATCH /users/${userId}/restore - Restaurando usuario`);
    return this.service.restore(userId);
  }
}
