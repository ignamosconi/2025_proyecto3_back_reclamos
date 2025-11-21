import { Controller, Get, Post, Patch, Delete, Body, Param, Inject } from '@nestjs/common';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import type { IAreasResponsablesService } from './interfaces/areas-responsables.service.interface';
import { IAREAS_RESPONSABLES_SERVICE } from './interfaces/areas-responsables.service.interface';
import type { IAreasResponsablesController } from './interfaces/areas-responsables.controller.interface';
import { AreaDocument } from './schemas/area.schema';

@Controller('areas')
export class AreasResponsablesController implements IAreasResponsablesController {

  constructor(
    @Inject(IAREAS_RESPONSABLES_SERVICE)
    private readonly service: IAreasResponsablesService,
  ) {}

  @Post()
  create(@Body() dto: CreateAreaDto): Promise<AreaDocument> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<AreaDocument[]> {
    return this.service.findAll();
  }

  @Get('deleted')
  findDeleted(): Promise<AreaDocument[]> {
    return this.service.findDeleted();
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<AreaDocument> {
    return this.service.findOne(id);
  }

  @Get('name/:nombre')
  findByName(@Param('nombre') nombre: string): Promise<AreaDocument | null> {
    return this.service.findByName(nombre);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateAreaDto): Promise<AreaDocument | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  softDelete(@Param('id', ParseObjectIdPipe) id: string): Promise<AreaDocument | null> {
    return this.service.softDelete(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseObjectIdPipe) id: string): Promise<AreaDocument | null> {
    return this.service.restore(id);
  }
}
