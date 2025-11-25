import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { GetAreasQueryDto } from './dto/get-area-query.dto';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import type { IAreasResponsablesService } from './interfaces/areas-responsables.service.interface';
import { IAREAS_RESPONSABLES_SERVICE } from './interfaces/areas-responsables.service.interface';
import { AreaDocument } from './schemas/area.schema';
import { PaginationResponseAreaDto } from './dto/pag-response-area.dto';

@ApiTags('Áreas')
@Controller('area-reclamo')
export class AreasResponsablesController {

  constructor(
    @Inject(IAREAS_RESPONSABLES_SERVICE)
    private readonly service: IAreasResponsablesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un área' })
  create(@Body() dto: CreateAreaDto): Promise<AreaDocument> {
    console.log(`[AreasResponsablesController] POST /area-reclamo - Creando área: ${dto.nombre}`);
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las áreas activas' })
  @ApiOkResponse({ type: PaginationResponseAreaDto })
  findAll(
    @Query() query: GetAreasQueryDto,
  ): Promise<PaginationResponseAreaDto> {
    console.log(`[AreasResponsablesController] GET /area-reclamo - Listando todas las áreas activas`);
    return this.service.findAll(query);
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Obtener todas las áreas soft-deleted' })
  @ApiOkResponse({ type: PaginationResponseAreaDto })
  findDeleted(
    @Query() query: GetAreasQueryDto,
  ): Promise<PaginationResponseAreaDto> {
    console.log(`[AreasResponsablesController] GET /area-reclamo/deleted - Listando áreas eliminadas con query:`);
    return this.service.findDeleted(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un área por ID' })
  findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<AreaDocument> {
    console.log(`[AreasResponsablesController] GET /area-reclamo/${id} - Obteniendo área por ID`);
    return this.service.findOne(id);
  }

  @Get('name/:nombre')
  @ApiOperation({ summary: 'Obtener un área por nombre' })
  findByName(@Param('nombre') nombre: string): Promise<AreaDocument | null> {
    console.log(`[AreasResponsablesController] GET /area-reclamo/name/${nombre} - Obteniendo área por nombre`);
    return this.service.findByName(nombre);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un área por ID' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateAreaDto): Promise<AreaDocument | null> {
    console.log(`[AreasResponsablesController] PATCH /area-reclamo/${id} - Actualizando área con datos:`, dto);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete de un área' })
  softDelete(@Param('id', ParseObjectIdPipe) id: string): Promise<AreaDocument | null> {
    console.log(`[AreasResponsablesController] DELETE /area-reclamo/${id} - Soft-deleting área`);
    return this.service.softDelete(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restaurar un área soft-deleted' })
  restore(@Param('id', ParseObjectIdPipe) id: string): Promise<AreaDocument | null> {
    console.log(`[AreasResponsablesController] PATCH /area-reclamo/${id}/restore - Restaurando área`);
    return this.service.restore(id);
  }
}
