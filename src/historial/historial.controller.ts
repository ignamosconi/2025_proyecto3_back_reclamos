import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { HistorialService } from './historial.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccionesHistorial } from './helpers/acciones-historial.enum';

@ApiTags('Historial')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('historial')
export class HistorialController {
     constructor(private readonly historialService: HistorialService) { }

     @Get(':reclamoId')
     @ApiOperation({ summary: 'Obtener el historial de un reclamo' })
     async getHistorial(@Param('reclamoId') reclamoId: string) {
          return this.historialService.findAllByReclamo(reclamoId);
     }

     @Post(':reclamoId/comentario')
     @ApiOperation({ summary: 'Agregar un comentario al historial' })
     async addComentario(
          @Param('reclamoId') reclamoId: string,
          @Body('comentario') comentario: string,
          @Request() req,
     ) {
          console.log('User in request:', req.user);
          const userId = req.user._id;
          return this.historialService.create(
               reclamoId,
               AccionesHistorial.COMENTAR,
               comentario,
               userId,
          );
     }
}
