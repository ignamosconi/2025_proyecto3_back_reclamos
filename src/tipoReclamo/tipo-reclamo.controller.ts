import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { CreateTipoReclamoDto } from './dto/create-tipo-reclamo.dto';
import { UpdateTipoReclamoDto } from './dto/update-tipo-reclamo.dto';
import { GetTipoReclamoQueryDto } from './dto/get-tipo-reclamo-query.dto';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import type { ITipoReclamoService} from './interfaces/tipo-reclamo.service.interface';
import { ITIPO_RECLAMO_SERVICE } from './interfaces/tipo-reclamo.service.interface';
import { TipoReclamoDocument } from './schemas/tipo-reclamo.schema';
import { PaginationResponseTipoDto } from './dto/pag-response-tipo.dto';

@ApiTags('Tipos de Reclamo')
@Controller('tipo-reclamo')
export class TipoReclamoController {
  constructor(
    @Inject(ITIPO_RECLAMO_SERVICE)
    private readonly service: ITipoReclamoService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un tipo de reclamo' })
  create(@Body() dto: CreateTipoReclamoDto): Promise<TipoReclamoDocument> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de reclamo activos' })
  @ApiOkResponse({ type: PaginationResponseTipoDto })
  findAll(@Query() query: GetTipoReclamoQueryDto): Promise<PaginationResponseTipoDto> {
    return this.service.findAll(query);
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Obtener todos los tipos de reclamo soft-deleted' })
  @ApiOkResponse({ type: PaginationResponseTipoDto })
  findDeleted(@Query() query: GetTipoReclamoQueryDto): Promise<PaginationResponseTipoDto> {
    return this.service.findDeleted(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de reclamo por ID' })
  findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<TipoReclamoDocument> {
    return this.service.findOne(id);
  }

  @Get('name/:nombre')
  @ApiOperation({ summary: 'Obtener un tipo de reclamo por nombre' })
  findByName(@Param('nombre') nombre: string): Promise<TipoReclamoDocument | null> {
    return this.service.findByName(nombre);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un tipo de reclamo por ID' })
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTipoReclamoDto): Promise<TipoReclamoDocument | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete de un tipo de reclamo' })
  softDelete(@Param('id', ParseObjectIdPipe) id: string): Promise<TipoReclamoDocument | null> {
    return this.service.softDelete(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restaurar un tipo de reclamo soft-deleted' })
  restore(@Param('id', ParseObjectIdPipe) id: string): Promise<TipoReclamoDocument | null> {
    return this.service.restore(id);
  }
}
