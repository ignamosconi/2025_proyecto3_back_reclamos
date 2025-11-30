import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/helpers/enum.roles';
import { CreateTipoReclamoDto } from './dto/create-tipo-reclamo.dto';
import { UpdateTipoReclamoDto } from './dto/update-tipo-reclamo.dto';
import { GetTipoReclamoQueryDto } from './dto/get-tipo-reclamo-query.dto';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import type { ITipoReclamoService} from './interfaces/tipo-reclamo.service.interface';
import { ITIPO_RECLAMO_SERVICE } from './interfaces/tipo-reclamo.service.interface';
import { TipoReclamoDocument } from './schemas/tipo-reclamo.schema';
import { PaginationResponseTipoDto } from './dto/pag-response-tipo.dto';

@ApiTags('Tipos de Reclamo')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('tipo-reclamo')
export class TipoReclamoController {
  constructor(
    @Inject(ITIPO_RECLAMO_SERVICE)
    private readonly service: ITipoReclamoService,
  ) {}

  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  @Post()
  @ApiOperation({ summary: 'Crear un tipo de reclamo' })
  create(@Body() dto: CreateTipoReclamoDto): Promise<TipoReclamoDocument> {
    console.log(`[TipoReclamoController] POST /tipo-reclamo - Creando tipo de reclamo: ${dto.nombre}`);
    return this.service.create(dto);
  }

  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de reclamo activos (todos los roles pueden leer)' })
  @ApiOkResponse({ type: PaginationResponseTipoDto })
  findAll(@Query() query: GetTipoReclamoQueryDto): Promise<PaginationResponseTipoDto> {
    console.log(`[TipoReclamoController] GET /tipo-reclamo - Listando tipos de reclamo activos con query:`, query);
    return this.service.findAll(query);
  }

  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
  @Get('name/:nombre')
  @ApiOperation({ summary: 'Obtener un tipo de reclamo por nombre (todos los roles pueden leer)' })
  findByName(@Param('nombre') nombre: string): Promise<TipoReclamoDocument | null> {
    console.log(`[TipoReclamoController] GET /tipo-reclamo/name/${nombre} - Obteniendo tipo de reclamo por nombre`);
    return this.service.findByName(nombre);
  }

  @Roles(UserRole.GERENTE)
  @Get('deleted')
  @ApiOperation({ summary: 'Obtener todos los tipos de reclamo soft-deleted' })
  @ApiOkResponse({ type: PaginationResponseTipoDto })
  findDeleted(@Query() query: GetTipoReclamoQueryDto): Promise<PaginationResponseTipoDto> {
    console.log(`[TipoReclamoController] GET /tipo-reclamo/deleted - Listando tipos de reclamo eliminados con query:`, query);
    return this.service.findDeleted(query);
  }

  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de reclamo por ID (todos los roles pueden leer)' })
  findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<TipoReclamoDocument> {
    console.log(`[TipoReclamoController] GET /tipo-reclamo/${id} - Obteniendo tipo de reclamo por ID`);
    return this.service.findOne(id);
  }

  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un tipo de reclamo por ID' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTipoReclamoDto): Promise<TipoReclamoDocument | null> {
    console.log(`[TipoReclamoController] PATCH /tipo-reclamo/${id} - Actualizando tipo de reclamo con datos:`, dto);
    return this.service.update(id, dto);
  }

  @Roles(UserRole.GERENTE)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete de un tipo de reclamo' })
  softDelete(@Param('id', ParseObjectIdPipe) id: string): Promise<TipoReclamoDocument | null> {
    console.log(`[TipoReclamoController] DELETE /tipo-reclamo/${id} - Soft-deleting tipo de reclamo`);
    return this.service.softDelete(id);
  }

  @Roles(UserRole.GERENTE)
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restaurar un tipo de reclamo soft-deleted' })
  restore(@Param('id', ParseObjectIdPipe) id: string): Promise<TipoReclamoDocument | null> {
    console.log(`[TipoReclamoController] PATCH /tipo-reclamo/${id}/restore - Restaurando tipo de reclamo`);
    return this.service.restore(id);
  }
}
