import {
  Controller,
  Get,
  Query,
  Inject,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetEncuestaQueryDto } from '../dto/get-encuesta-query.dto';
import { PaginationResponseEncuestaDto } from '../dto/pag-response-encuesta.dto';
import type { IEncuestaService } from '../services/interfaces/encuesta.service.interface';
import { IENCUESTA_SERVICE } from '../services/interfaces/encuesta.service.interface';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { UserRole } from 'src/users/helpers/enum.roles';

@ApiTags('Encuestas')
@ApiBearerAuth()
@Controller('encuestas')
export class EncuestasController {
  constructor(
    @Inject(IENCUESTA_SERVICE)
    private readonly encuestaService: IEncuestaService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las encuestas (Rol: Encargado, Gerente)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PaginationResponseEncuestaDto,
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ENCARGADO, UserRole.GERENTE)
  async findAll(
    @Query() query: GetEncuestaQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<PaginationResponseEncuestaDto> {
    console.log(
      `[EncuestasController] GET /encuestas - Listando todas las encuestas`,
    );
    const userRole = (req.user as any).role || (req.user as any).rol;
    return this.encuestaService.findAll(query, userRole);
  }
}

