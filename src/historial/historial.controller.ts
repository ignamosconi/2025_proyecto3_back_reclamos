import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { HistorialService } from './historial.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AccionesHistorial } from './helpers/acciones-historial.enum';
import { HistorialResponseDto } from './dto/historial-response.dto';

@ApiTags('Historial')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('historial')
export class HistorialController {
     constructor(private readonly historialService: HistorialService) { }

     @Get(':reclamoId')
     @ApiOperation({ summary: 'Obtener el historial de un reclamo con metadata de estados' })
     @ApiResponse({ status: 200, type: [HistorialResponseDto], description: 'Lista del historial del reclamo incluyendo metadata de estado_anterior y estado_actual' })
     async getHistorial(@Param('reclamoId') reclamoId: string): Promise<HistorialResponseDto[]> {
          const historial = await this.historialService.findAllByReclamo(reclamoId);
          
          // Convertir a objetos planos para asegurar que la metadata se serialice correctamente
          return historial.map(h => {
               const obj = (h && typeof (h as any).toObject === 'function') ? (h as any).toObject() : h;
               return {
                    _id: obj._id.toString(),
                    fecha_hora: obj.fecha_hora,
                    responsable: {
                         _id: obj.responsable._id?.toString() || obj.responsable.toString(),
                         firstName: obj.responsable.firstName,
                         lastName: obj.responsable.lastName,
                         email: obj.responsable.email,
                    },
                    accion: obj.accion,
                    detalle: obj.detalle,
                    metadata: obj.metadata || {},
                    reclamoId: obj.reclamoId?.toString() || obj.reclamoId,
                    createdAt: obj.createdAt,
                    updatedAt: obj.updatedAt,
               } as HistorialResponseDto;
          });
     }

     @Post(':reclamoId/comentario')
     @ApiOperation({ summary: 'Agregar un comentario al historial', description: 'Solo encargados y gerentes pueden agregar comentarios.' })
     @ApiParam({ name: 'reclamoId', description: 'ID del reclamo', type: 'string' })
     @ApiBody({ description: 'Comentario', type: String })
     @ApiResponse({ status: 201, type: HistorialResponseDto, description: 'Comentario agregado exitosamente' })
     async addComentario(
          @Param('reclamoId') reclamoId: string,
          @Body('comentario') comentario: string,
          @Request() req,
     ): Promise<HistorialResponseDto> {
          const userId = req.user._id;
          const historial = await this.historialService.create(
               reclamoId,
               AccionesHistorial.COMENTAR,
               comentario,
               userId,
          );

          // Convertir a objeto plano para asegurar serialización correcta
          const obj = (historial && typeof (historial as any).toObject === 'function') ? (historial as any).toObject() : historial;
          return {
               _id: obj._id.toString(),
               fecha_hora: obj.fecha_hora,
               responsable: {
                    _id: obj.responsable._id?.toString() || obj.responsable.toString(),
                    firstName: obj.responsable.firstName || '',
                    lastName: obj.responsable.lastName || '',
                    email: obj.responsable.email || '',
               },
               accion: obj.accion,
               detalle: obj.detalle,
               metadata: obj.metadata || {},
               reclamoId: obj.reclamoId?.toString() || obj.reclamoId,
               createdAt: obj.createdAt,
               updatedAt: obj.updatedAt,
          } as HistorialResponseDto;
     }
}
