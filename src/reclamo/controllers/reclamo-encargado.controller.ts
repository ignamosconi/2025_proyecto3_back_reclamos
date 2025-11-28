import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  Inject,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { UserRole } from 'src/users/helpers/enum.roles';
import { UpdateEncargadosDto } from '../dto/update-encargados.dto';
import { ReclamoResponseDto } from '../dto/reclamo-response.dto';
import type { ReclamoEncargadoService } from '../service/reclamo-encargado.service';

import { IReclamoEncargadoController } from './interfaces/reclamo-encargado.controller.interface';

@ApiTags('Reclamo - Encargados')
@ApiBearerAuth()
@Controller('reclamos/:reclamoId/encargados')
export class ReclamoEncargadoController implements IReclamoEncargadoController {
  constructor(
    @Inject('IReclamoEncargadoService')
    private readonly service: ReclamoEncargadoService,
  ) { }

  @Post('auto-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autoasigna un encargado al reclamo y cambia estado a EN_REVISION' })
  @ApiParam({ name: 'reclamoId', type: 'string' })
  @ApiBody({ schema: { type: 'object', properties: { encargadoId: { type: 'string', format: 'ObjectId' } } } })
  @ApiResponse({ status: HttpStatus.OK, type: ReclamoResponseDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  async autoAssign(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string,
    @Body('encargadoId') encargadoId: string,
    @Req() req: RequestWithUser,
  ): Promise<ReclamoResponseDto> {
    // admin user available in req.user if needed
    const updated = await this.service.autoAssign(reclamoId, encargadoId);
    return updated.toObject() as ReclamoResponseDto;
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Añadir/Quitar encargados del equipo (EN_REVISION)' })
  @ApiParam({ name: 'reclamoId', type: 'string' })
  @ApiBody({ type: UpdateEncargadosDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  async updateTeam(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string,
    @Body() data: UpdateEncargadosDto,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const adminId = String((req.user as any)._id);
    await this.service.updateTeam(reclamoId, adminId, data);
  }
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener encargados asignados al reclamo' })
  @ApiParam({ name: 'reclamoId', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de encargados asignados.' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  async getEncargados(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string,
  ): Promise<any[]> {
    return this.service.getEncargados(reclamoId);
  }
}
