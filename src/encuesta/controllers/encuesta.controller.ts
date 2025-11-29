import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Inject,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateEncuestaDto } from '../dto/create-encuesta.dto';
import { EncuestaResponseDto } from '../dto/encuesta-response.dto';
import { GetEncuestaQueryDto } from '../dto/get-encuesta-query.dto';
import { PaginationResponseEncuestaDto } from '../dto/pag-response-encuesta.dto';
import type { IEncuestaService } from '../services/interfaces/encuesta.service.interface';
import { IENCUESTA_SERVICE } from '../services/interfaces/encuesta.service.interface';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { UserRole } from 'src/users/helpers/enum.roles';

@ApiTags('Encuestas')
@ApiBearerAuth()
@Controller('reclamos')
export class EncuestaController {
  constructor(
    @Inject(IENCUESTA_SERVICE)
    private readonly encuestaService: IEncuestaService,
  ) {}

  @Post(':reclamoId/encuesta')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear encuesta de satisfacción (Rol: Cliente)' })
  @ApiParam({ name: 'reclamoId', description: 'ID del reclamo', type: 'string' })
  @ApiBody({ type: CreateEncuestaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: EncuestaResponseDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  async createEncuesta(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string,
    @Body() data: CreateEncuestaDto,
    @Req() req: RequestWithUser,
  ): Promise<EncuestaResponseDto> {
    console.log(
      `[EncuestaController] POST /reclamos/${reclamoId}/encuesta - Creando encuesta de satisfacción`,
    );
    const clienteId = String((req.user as any)._id);
    const encuesta = await this.encuestaService.create(
      data,
      clienteId,
      reclamoId,
    );
    return encuesta.toObject() as EncuestaResponseDto;
  }

  @Get(':reclamoId/encuesta')
  @ApiOperation({ summary: 'Obtener encuesta de satisfacción' })
  @ApiParam({ name: 'reclamoId', description: 'ID del reclamo', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, type: EncuestaResponseDto })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE, UserRole.ENCARGADO, UserRole.GERENTE)
  async getEncuestaByReclamo(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string,
    @Req() req: RequestWithUser,
  ): Promise<EncuestaResponseDto | null> {
    console.log(
      `[EncuestaController] GET /reclamos/${reclamoId}/encuesta - Obteniendo encuesta de satisfacción`,
    );
    const userId = String((req.user as any)._id);
    const userRole = (req.user as any).role || (req.user as any).rol;
    const encuesta = await this.encuestaService.findByReclamoId(
      reclamoId,
      userRole,
      userId,
    );
    return encuesta ? (encuesta.toObject() as EncuestaResponseDto) : null;
  }
}

