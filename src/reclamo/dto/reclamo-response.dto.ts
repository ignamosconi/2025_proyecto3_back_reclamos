// src/reclamos/dto/reclamo-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prioridad } from '../enums/prioridad.enum';
import { Criticidad } from '../enums/criticidad.enum';
import { EstadoReclamo } from '../enums/estado.enum';
import { EncargadoResponseDto } from './encargado-response.dto';
import { SintesisResponseDto } from 'src/sintesis/dto/sintesis-response.dto';

export class ReclamoResponseDto {
    
    @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
    readonly _id: string;

    @ApiProperty({ example: 'Fallo en la carga del módulo A' })
    readonly titulo: string;

    @ApiProperty({ example: 'Al intentar ingresar al módulo, aparece un error 500...' })
    readonly descripcion: string;

    @ApiProperty({ enum: Prioridad, example: Prioridad.MEDIA })
    readonly prioridad: Prioridad;

    @ApiProperty({ enum: Criticidad, example: Criticidad.NO })
    readonly criticidad: Criticidad;

    @ApiProperty({ enum: EstadoReclamo, example: EstadoReclamo.PENDIENTE })
    readonly estado: EstadoReclamo;

    @ApiProperty({ type: String, format: 'ObjectId' })
    readonly fkCliente: string;

    @ApiProperty({ type: String, format: 'ObjectId' })
    readonly fkProyecto: string;

    @ApiProperty({ type: String, format: 'ObjectId' })
    readonly fkTipoReclamo: string;

    @ApiProperty({ type: String, format: 'ObjectId' })
    readonly fkArea: string;
    
    @ApiProperty({ type: Date, example: '2025-11-25T17:00:00.000Z' })
    readonly createdAt: Date;

    @ApiProperty({ type: Date, example: '2025-11-25T18:30:00.000Z' })
    readonly updatedAt: Date;

    @ApiPropertyOptional({ type: [EncargadoResponseDto], description: 'Lista de encargados asignados al reclamo' })
    readonly encargados?: EncargadoResponseDto[];

    @ApiPropertyOptional({ type: [SintesisResponseDto], description: 'Lista de síntesis del reclamo (changelogs para el cliente)' })
    readonly sintesis?: SintesisResponseDto[];
}