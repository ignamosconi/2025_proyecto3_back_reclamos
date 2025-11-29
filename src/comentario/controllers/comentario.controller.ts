import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateComentarioDto } from '../dto/create-comentario.dto';
import { ComentarioResponseDto } from '../dto/comentario-response.dto';
import type { IComentarioService } from '../services/interfaces/comentario.service.interface';
import { ICOMENTARIO_SERVICE } from '../services/interfaces/comentario.service.interface';
import { ParseObjectIdPipe } from 'src/common/pipes/objectId.pipe';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { UserRole } from 'src/users/helpers/enum.roles';
import { Comentario } from '../schemas/comentario.schema';

@ApiTags('Comentarios')
@ApiBearerAuth()
@Controller('reclamos/:reclamoId/comentarios')
export class ComentarioController {
  constructor(
    @Inject(ICOMENTARIO_SERVICE)
    private readonly comentarioService: IComentarioService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un comentario interno en un reclamo',
    description: 'Solo Gerentes y Encargados asignados al reclamo pueden crear comentarios.',
  })
  @ApiParam({ name: 'reclamoId', type: 'string', description: 'ID del reclamo' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Comentario creado exitosamente',
    type: ComentarioResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permiso para comentar en este reclamo',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reclamo no encontrado',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  async create(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string,
    @Body() data: CreateComentarioDto,
    @Req() req: RequestWithUser,
  ): Promise<ComentarioResponseDto> {
    const autorId = String((req.user as any)._id);
    const autorRole = (req.user as any).role || (req.user as any).rol;

    const comentario = await this.comentarioService.create(
      reclamoId,
      data,
      autorId,
      autorRole,
    );

    return comentario.toObject() as ComentarioResponseDto;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los comentarios internos de un reclamo',
    description: 'Solo Gerentes y Encargados asignados al reclamo pueden ver los comentarios.',
  })
  @ApiParam({ name: 'reclamoId', type: 'string', description: 'ID del reclamo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de comentarios del reclamo',
    type: [ComentarioResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permiso para ver los comentarios de este reclamo',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reclamo no encontrado',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  async findAll(
    @Param('reclamoId', ParseObjectIdPipe) reclamoId: string,
    @Req() req: RequestWithUser,
  ): Promise<ComentarioResponseDto[]> {
    const userId = String((req.user as any)._id);
    const userRole = (req.user as any).role || (req.user as any).rol;

    const comentarios = await this.comentarioService.findByReclamoId(
      reclamoId,
      userId,
      userRole,
    );

    return comentarios.map((c) => c.toObject() as ComentarioResponseDto);
  }
}

